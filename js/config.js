const config = {
        repoName: "gifter",
        fonts: {
            primary: "'Dancing Script', cursive", // Fancy font for titles
            secondary: "'Montserrat', sans-serif" // Modern sans-serif for body
        },
        title: {
        en: "English Title",
        he: "הכותרת בעברית"
    },
    message: {
        en: "Send a gift:",
        he: "שלחו מתנה:"
    },
    image: "assets/wedding.png",
    backgroundLight: "assets/bg-light.jpg",
    backgroundDark: "assets/bg-dark.jpg",
    gifts: [
        {
            name: { en: "Bit", he: "ביט" },
            url: ["https://bit.co.il/1", "https://bit.co.il/2"],
            logo: "https://play-lh.googleusercontent.com/SovCyuQk4A0se4hmrQbf1OJXznHlfseeq9YtPh_WHe3lVMFzZcXqBGfW2J_1yYI6yQ=w240-h480-rw"
        },
        {
            name: { en: "Paybox", he: "פייבוקס" },
            url: "https://paybox.co.il",
            logo: "https://yt3.googleusercontent.com/ytc/AIdro_lhy54u_HxaHGFBzqnJbd6oh7cVzfpbDdxBsCFn4ohvlss=s900-c-k-c0x00ffffff-no-rj"
        },
    ]
};