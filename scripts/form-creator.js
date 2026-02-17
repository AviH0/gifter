#!/usr/bin/env node

/**
 * Google Forms Creator - Automated Form Creation Tool
 * 
 * This script automatically creates a Google Form with all required Hebrew fields
 * for the wedding gifts platform. It uses the Google Forms API to:
 * 
 * 1. Create a new form with Hebrew title and description
 * 2. Add all required fields (email, titles, messages, images, gifts)
 * 3. Configure file uploads for images
 * 4. Set up form triggers for the Apps Script
 * 5. Output the form URL and ID for further configuration
 * 
 * Prerequisites:
 * - Google Cloud project with Forms API enabled
 * - OAuth 2.0 credentials downloaded as credentials.json
 * - Node.js 14+ installed
 * 
 * Usage:
 *   node form-creator.js [--gifts=5] [--title="Custom Title"]
 * 
 * Options:
 *   --gifts=N      Number of gift fields to create (default: 5)
 *   --title=TEXT   Custom form title (default: "טופס יצירת אירוע")
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');
const readline = require('readline');

// Configuration
const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Default configuration
const DEFAULT_CONFIG = {
  numGifts: 5,
  formTitle: 'טופס יצירת אירוע - Wedding Gifts Platform',
  formDescription: 'מלאו את הטופס הזה כדי ליצור דף אירוע אישי עם אפשרויות מתנות לאורחים שלכם.\n\nFill out this form to create a personalized event page with gift options for your guests.'
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  args.forEach(arg => {
    if (arg.startsWith('--gifts=')) {
      config.numGifts = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--title=')) {
      config.formTitle = arg.split('=')[1].replace(/^["']|["']$/g, '');
    }
  });

  return config;
}

/**
 * Load or request authorization to access Google Forms API
 */
async function authorize() {
  let credentials;
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    credentials = JSON.parse(content);
  } catch (err) {
    console.error('Error loading credentials.json:');
    console.error('Please download OAuth 2.0 credentials from Google Cloud Console');
    console.error('https://console.cloud.google.com/apis/credentials');
    throw err;
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have a token already
  try {
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    // Need to get a new token
    return getAccessToken(oAuth2Client);
  }
}

/**
 * Get and store new access token with automatic code capture
 */
async function getAccessToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    // Start a local server to capture the OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/oauth2callback') > -1) {
          // Extract the code from the URL
          const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
          const code = qs.get('code');
          
          if (!code) {
            res.end('Error: No authorization code received. Please try again.');
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          console.log('\n✅ Authorization code received!');
          
          // Send success page to browser
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Authorization Successful</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  }
                  .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                  }
                  h1 { color: #4CAF50; margin-bottom: 20px; }
                  p { color: #666; line-height: 1.6; }
                  .success-icon { font-size: 64px; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="success-icon">✅</div>
                  <h1>Authorization Successful!</h1>
                  <p>You can now close this window and return to the terminal.</p>
                  <p>The form creator will continue automatically.</p>
                </div>
              </body>
            </html>
          `);

          // Exchange the code for tokens
          try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
            console.log('✅ Token stored successfully\n');
            
            server.close();
            resolve(oAuth2Client);
          } catch (err) {
            console.error('❌ Error exchanging code for tokens:', err.message);
            server.close();
            reject(err);
          }
        }
      } catch (err) {
        console.error('❌ Error in OAuth callback:', err.message);
        res.end('Error: ' + err.message);
        server.close();
        reject(err);
      }
    });

    // Start the server on port 3000
    server.listen(3000, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log('\n🔐 Opening browser for authorization...');
      console.log('\n📋 Please authorize this app by visiting this URL:');
      console.log('\n' + authUrl + '\n');
      console.log('💡 TIP: Copy the URL above if your browser doesn\'t open automatically\n');
      console.log('⏳ Waiting for authorization...\n');

      // Try to open the browser automatically (works on most systems)
      const open = require('child_process').exec;
      const command = process.platform === 'win32' ? 'start' : 
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
      open(`${command} "${authUrl}"`);
    });

    // Fallback: if user closes terminal, clean up server
    process.on('SIGINT', () => {
      console.log('\n\n❌ Authorization cancelled by user');
      server.close();
      process.exit(1);
    });
  });
}

/**
 * Create the form structure with all required fields
 */
function buildFormStructure(config) {
  const requests = [];
  let currentIndex = 0;

  // 1. Email field (required)
  requests.push({
    createItem: {
      item: {
        title: 'אימייל',
        description: 'כתובת האימייל שלך (נשתמש בה כדי לשלוח לך את הקישור לאירוע)',
        questionItem: {
          question: {
            required: true,
            textQuestion: {
              paragraph: false
            }
          }
        }
      },
      location: {
        index: currentIndex++
      }
    }
  });

  // 2. Event Title (English) - required
  requests.push({
    createItem: {
      item: {
        title: 'כותרת האירוע (אנגלית)',
        description: "שם האירוע באנגלית (לדוגמה: 'Sarah & John's Wedding')",
        questionItem: {
          question: {
            required: true,
            textQuestion: {
              paragraph: false
            }
          }
        }
      },
      location: {
        index: currentIndex++
      }
    }
  });

  // 3. Event Title (Hebrew) - optional
  requests.push({
    createItem: {
      item: {
        title: 'כותרת האירוע (עברית)',
        description: "שם האירוע בעברית (לדוגמה: 'החתונה של שרה וג'ון') - אופציונלי",
        questionItem: {
          question: {
            required: false,
            textQuestion: {
              paragraph: false
            }
          }
        }
      },
      location: {
        index: currentIndex++
      }
    }
  });

  // 4. Message to guests (English) - required
  requests.push({
    createItem: {
      item: {
        title: 'הודעה לאורחים (אנגלית)',
        description: "הודעה לאורחים באנגלית (לדוגמה: 'Send us a gift to help start our new life together!')",
        questionItem: {
          question: {
            required: true,
            textQuestion: {
              paragraph: true
            }
          }
        }
      },
      location: {
        index: currentIndex++
      }
    }
  });

  // 5. Message to guests (Hebrew) - optional
  requests.push({
    createItem: {
      item: {
        title: 'הודעה לאורחים (עברית)',
        description: "הודעה לאורחים בעברית (לדוגמה: 'שלחו לנו מתנה כדי לעזור לנו להתחיל את החיים החדשים שלנו!') - אופציונלי",
        questionItem: {
          question: {
            required: false,
            textQuestion: {
              paragraph: true
            }
          }
        }
      },
      location: {
        index: currentIndex++
      }
    }
  });

  // Note: File upload fields (תמונת האירוע, רקע בהיר, רקע כהה) 
  // cannot be created via the API and must be added manually.
  // See post-creation instructions for details.

  // 9-N. Gift fields (repeated for each gift)
  for (let i = 1; i <= config.numGifts; i++) {
    // Gift Name (English)
    requests.push({
      createItem: {
        item: {
          title: `מתנה ${i} - שם (אנגלית)`,
          description: `שם אמצעי התשלום באנגלית (לדוגמה: 'Bit', 'PayBox', 'Venmo')${i === 1 ? ' - חובה' : ' - אופציונלי'}`,
          questionItem: {
            question: {
              required: i === 1,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: currentIndex++
        }
      }
    });

    // Gift Name (Hebrew)
    requests.push({
      createItem: {
        item: {
          title: `מתנה ${i} - שם (עברית)`,
          description: `שם אמצעי התשלום בעברית (לדוגמה: 'ביט', 'פייבוקס') - אופציונלי`,
          questionItem: {
            question: {
              required: false,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: currentIndex++
        }
      }
    });

    // Gift URL 1 (required for first gift)
    requests.push({
      createItem: {
        item: {
          title: `מתנה ${i} - קישור 1`,
          description: `קישור לאמצעי התשלום (לדוגמה: https://bit.co.il/app/?uid=xxx)${i === 1 ? ' - חובה' : ' - אופציונלי'}`,
          questionItem: {
            question: {
              required: i === 1,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: currentIndex++
        }
      }
    });

    // Gift URL 2 (optional)
    requests.push({
      createItem: {
        item: {
          title: `מתנה ${i} - קישור 2`,
          description: 'קישור נוסף (אופציונלי)',
          questionItem: {
            question: {
              required: false,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: currentIndex++
        }
      }
    });

    // Gift Logo URL
    requests.push({
      createItem: {
        item: {
          title: `מתנה ${i} - לוגו`,
          description: 'קישור ללוגו של אמצעי התשלום (PNG/JPG/SVG) - אופציונלי',
          questionItem: {
            question: {
              required: false,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: currentIndex++
        }
      }
    });
  }

  return { requests };
}

/**
 * Create the form using Google Forms API
 */
async function createForm(auth, config) {
  const forms = google.forms({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  console.log('\n📝 Creating form...');

  // Step 1: Create initial form
  const form = await forms.forms.create({
    requestBody: {
      info: {
        title: config.formTitle,
        documentTitle: config.formTitle
      }
    }
  });

  const formId = form.data.formId;
  console.log(`✅ Form created with ID: ${formId}`);
  console.log(`   View at: https://docs.google.com/forms/d/${formId}/edit`);

  // Step 2: Update form settings (collect emails, allow response editing)
  console.log('\n⚙️  Configuring form settings...');
  
  const settingsUpdate = {
    requests: [
      {
        updateFormInfo: {
          info: {
            description: config.formDescription
          },
          updateMask: 'description'
        }
      },
      {
        updateSettings: {
          settings: {
            quizSettings: {
              isQuiz: false
            }
          },
          updateMask: 'quizSettings.isQuiz'
        }
      }
    ]
  };

  await forms.forms.batchUpdate({
    formId: formId,
    requestBody: settingsUpdate
  });

  console.log('✅ Form settings updated');

  // Step 3: Add all form fields
  console.log('\n📋 Adding form fields...');
  console.log(`   - Creating ${config.numGifts} gift field sets`);
  
  const formStructure = buildFormStructure(config);
  
  await forms.forms.batchUpdate({
    formId: formId,
    requestBody: formStructure
  });

  console.log(`✅ Added all form fields (${formStructure.requests.length} items)`);

  // Step 4: Publish the form
  console.log('\n🌐 Publishing form...');
  
  await forms.forms.batchUpdate({
    formId: formId,
    requestBody: {
      requests: [
        {
          updateSettings: {
            settings: {
              publishSettings: {
                isPublished: true,
                isAcceptingResponses: true
              }
            },
            updateMask: 'publishSettings.isPublished,publishSettings.isAcceptingResponses'
          }
        }
      ]
    }
  });

  console.log('✅ Form published and accepting responses');

  return {
    formId,
    formUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    viewUrl: `https://docs.google.com/forms/d/e/${formId}/viewform`
  };
}

/**
 * Display post-creation instructions
 */
function displayInstructions(result, config) {
  console.log('\n' + '='.repeat(80));
  console.log('✅ FORM CREATED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log('\n📋 Form Details:');
  console.log(`   Form ID: ${result.formId}`);
  console.log(`   Edit URL: ${result.formUrl}`);
  console.log(`   Public URL: ${result.viewUrl}`);
  console.log(`   Number of Gifts: ${config.numGifts}`);
  
  console.log('\n⚠️  IMPORTANT: Manual Steps Required');
  console.log('='.repeat(80));
  console.log('\n📸 Add File Upload Fields (API Limitation):');
  console.log('   The Google Forms API does not support creating file upload fields.');
  console.log('   You must add these 3 fields MANUALLY in the form editor:\n');
  console.log('   1. תמונת האירוע (Wedding Image)');
  console.log('      - Type: File upload');
  console.log('      - Description: "תמונה ראשית לאירוע (מומלץ: 800x600px, עד 10MB)"');
  console.log('      - Settings: Allow only images, max 1 file, max 10MB');
  console.log('      - Optional (not required)\n');
  console.log('   2. רקע בהיר (Background Light)');
  console.log('      - Type: File upload');
  console.log('      - Description: "תמונת רקע למצב בהיר (אופקית, עד 10MB)"');
  console.log('      - Settings: Allow only images, max 1 file, max 10MB');
  console.log('      - Optional (not required)\n');
  console.log('   3. רקע כהה (Background Dark)');
  console.log('      - Type: File upload');
  console.log('      - Description: "תמונת רקע למצב כהה (אופקית, עד 10MB)"');
  console.log('      - Settings: Allow only images, max 1 file, max 10MB');
  console.log('      - Optional (not required)\n');
  console.log('   💡 TIP: Add these fields AFTER the message fields and BEFORE the gift fields');
  
  console.log('\n📝 Additional Setup Steps:');
  console.log('   1. Open the edit URL above');
  console.log('   2. Add the 3 file upload fields manually (see above)');
  console.log('   3. Copy the Apps Script from scripts/templates/apps-script.js');
  console.log('   4. In form editor: Three dots (⋮) → "Script editor"');
  console.log('   5. Paste the code and configure:');
  console.log('      - GITHUB_OWNER: Your GitHub username');
  console.log('      - GITHUB_REPO: Your repository name');
  console.log('      - GITHUB_TOKEN: Your personal access token');
  console.log('      - SENDER_EMAIL: Your Gmail address');
  console.log('   6. Save the script (Ctrl+S)');
  console.log('   7. Set up form trigger:');
  console.log('      - Apps Script: Triggers (⏰) → Add Trigger');
  console.log('      - Function: onFormSubmit');
  console.log('      - Event: From form → On form submit');
  console.log('   8. Test by submitting the form');
  console.log('\n💾 Save these details for reference!');
  console.log('='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Wedding Gifts Platform - Automated Form Creator');
  console.log('='.repeat(80));
  
  try {
    // Parse configuration
    const config = parseArgs();
    console.log('\n⚙️  Configuration:');
    console.log(`   Form title: ${config.formTitle}`);
    console.log(`   Number of gifts: ${config.numGifts}`);

    // Authenticate
    console.log('\n🔐 Authenticating with Google...');
    const auth = await authorize();
    console.log('✅ Authentication successful');

    // Create form
    const result = await createForm(auth, config);

    // Display instructions
    displayInstructions(result, config);

    // Save result to file
    const outputPath = path.join(__dirname, 'form-info.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Form details saved to: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', error.errors);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createForm, buildFormStructure };
