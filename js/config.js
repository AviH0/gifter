const config = {
        repoName: "gifter",
        fonts: {
            primary: "'Noto Sans Hebrew', sans-serif", // Font for titles
            secondary: "'Rubik', sans-serif" // Modern sans-serif for body
        },
        title: {
        en: "Sapir and Nadav's wedding!",
        he: "החתונה של ישראל וטליה"
    },
    message: {
        en: "Send a gift:",
        he: "שלחו מתנה:"
    },
    image: "assets/wedding.jpeg",
    backgroundLight: "assets/bg-light.png",
    backgroundDark: "assets/bg-dark.png",
    gifts: [
        {
            name: { en: "Bit", he: "ביט" },
            url: ["https://www.bitpay.co.il/app/me/89FFE786-6770-7615-4090-8CDC70219CE68154", "https://www.bitpay.co.il/app/me/3C922736-DEB2-1356-D1F4-F35030904845AA8A"],
            logo: "https://play-lh.googleusercontent.com/SovCyuQk4A0se4hmrQbf1OJXznHlfseeq9YtPh_WHe3lVMFzZcXqBGfW2J_1yYI6yQ=w240-h480-rw"
        },
        {
            name: { en: "Paybox", he: "פייבוקס" },
            url: ["https://links.payboxapp.com/qIwkpHwmz0b", "https://links.payboxapp.com/pgJnhCAtA0b"],
            logo: "https://yt3.googleusercontent.com/ytc/AIdro_lhy54u_HxaHGFBzqnJbd6oh7cVzfpbDdxBsCFn4ohvlss=s900-c-k-c0x00ffffff-no-rj"
        },
    ]
};
