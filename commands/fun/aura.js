const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aura')
        .setDescription('Scan a user with fake advanced AI and check their meme aura! Trust me bro.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user you want to scan')
                .setRequired(false)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;

        const fakeLevels = [
            // -999 to -1
            "-9999 Aura (Bro negative riz, absolute negative IQ)",
            "-9998 Aura (Forgets how to breathe manually)",
            "-9997 Aura (Eats cereal with water)",
            "-9996 Aura (Cries while eating ice cream)",
            "-9995 Aura (Loses arguments to microwave)",
            "-9994 Aura (Pushes pull doors)",
            "-9993 Aura (Searches for phone using phone's flashlight)",
            "-9992 Aura (Tries to unlock car with microwave remote)",
            "-9991 Aura (Believes birds are government drones)",
            "-9990 Aura (Sleeps with shoes on)",
            "-9989 Aura (Brushes teeth with peanut butter)",
            "-9988 Aura (Fails tutorial level of every game)",
            "-9987 Aura (Asks Siri for life advice)",
            "-9986 Aura (Gets lost in an empty room)",
            "-9985 Aura (Bites ice cream with front teeth)",
            "-9984 Aura (Puts milk before the bowl)",
            "-9983 Aura (Thinks 2+2 equals fish)",
            "-9982 Aura (Waits at a stop sign until it turns green)",
            "-9981 Aura (Tries to swipe a printed picture like a touchscreen)",
            "-9980 Aura (Forgets his own password on first try)",
            "-9979 Aura (Claps when the airplane lands safely)",
            "-9978 Aura (Wears sunglasses inside a dark room)",
            "-9977 Aura (Eats soup with a fork)",
            "-9976 Aura (Thinks Minecraft dirt blocks are real cake)",
            "-9975 Aura (Calls tech support because monitor is turned off)",
            "-9974 Aura (Tries to charge phone in a microwave)",
            "-9973 Aura (Writes down passwords on a sticky note on the monitor)",
            "-9972 Aura (Loses a game of tic-tac-toe against a wall)",
            "-9971 Aura (Cries during a math test)",
            "-9970 Aura (Tries to pet a stray rabid dog)",
            "-9969 Aura (Negative energy levels breaking the laws of physics)",
            "-9968 Aura (Bro trips over flat wireless bluetooth connection)",
            "-9967 Aura (Wears socks inside muddy puddles)",
            "-9966 Aura (Thinks Wi-Fi comes from birds)",
            "-9965 Aura (Tries to download more RAM from a sketchy website)",
            "-9964 Aura (Forgets how to blink)",
            "-9963 Aura (Drops phone on face while lying in bed every single night)",
            "-9962 Aura (Uses sandpaper as toilet paper)",
            "-9961 Aura (Thinks gravity is optional if you jump high enough)",
            "-9960 Aura (Gets defeated by a captcha saying 'select all traffic lights')",
            "-9959 Aura (Tries to unlock front door with a car key)",
            "-9958 Aura (Reads terms and conditions for fun and cries)",
            "-9957 Aura (Eats spicy chips and cries for milk)",
            "-9956 Aura (Bakes ice cream in the oven)",
            "-9955 Aura (Tries to text people using a TV remote)",
            "-9954 Aura (Believes the earth is shaped like a dinosaur)",
            "-9953 Aura (Forgets his own birthday)",
            "-9952 Aura (Tries to open a PDF with a hammer)",
            "-9951 Aura (Fails kindergarten shape sorting test)",
            "-9950 Aura (Absolute negative brain power)",
            "-9949 Aura (Wears winter jacket in July desert)",
            "-9948 Aura (Tries to type on a calculator like it's discord)",
            "-9947 Aura (Thinks shadow monsters are real)",
            "-9946 Aura (Gets scared of his own reflection)",
            "-9945 Aura (Tries to delete system 32 for extra FPS)",
            "-9944 Aura (Bites the dust literally)",
            "-9943 Aura (Fails sleeping competition)",
            "-9942 Aura (Bro is a certified goofball)",
            "-9941 Aura (Wears two left shoes on purpose)",
            "-9940 Aura (Tries to boil ice cubes)",
            "-9939 Aura (Thinks batteries taste like spicy candy)",
            "-9938 Aura (Fails breathing test)",
            "-9937 Aura (Stares at a juice box because it says 'concentrate')",
            "-9936 Aura (Tries to plug USB upside down 50 times)",
            "-9935 Aura (Gets lost inside a grocery store aisle)",
            "-9934 Aura (Bro is running on internet explorer brain speed)",
            "-9933 Aura (Tries to microwave metal spoon)",
            "-9932 Aura (Forgets how to tie shoes)",
            "-9931 Aura (Eats raw instant noodles dry)",
            "-9930 Aura (Thinks Bluetooth is a blue tooth)",

            // 0 Aura / NPC Level
            "0 Aura (NPC behavior detected, walks into walls)",
            "1 Aura (Just vibe and static noise)",
            "2 Aura (Background character in a low budget movie)",
            "3 Aura (Exists purely to fill server member count)",
            "4 Aura (Statue mode activated)",
            "5 Aura (Bro is just a pixel on the screen)",
            "10 Aura (NPC dialogue: 'Hello traveler!')",
            "15 Aura (Watches paint dry for fun)",
            "20 Aura (Listens to white noise to get hyped)",
            "25 Aura (Blinks twice if held hostage by boredom)",
            "30 Aura (NPC script loop error)",
            "35 Aura (Stares blankly into the void)",
            "40 Aura (Waits for patch notes to change personality)",
            "45 Aura (Generic villager sound effects: Hmmm)",
            "50 Aura (Equally balanced, completely forgettable)",

            // Medium / Weird Aura
            "100 Aura (Average discord moderator energy)",
            "150 Aura (Drinks energy drinks to sleep)",
            "200 Aura (Types with one finger)",
            "250 Aura (Uses light mode discord on max brightness)",
            "300 Aura (Sends 'gm' in 50 servers simultaneously)",
            "350 Aura (Has 99+ unread pings and ignores them all)",
            "400 Aura (Argues with bots online)",
            "450 Aura (Keeps talking even when muted)",
            "500 Aura (Mid tier meme enjoyer)",
            "600 Aura (Spams skull emojis on every message 💀)",
            "700 Aura (Thinks they are the main character)",
            "800 Aura (Eats pizza crust first)",
            "900 Aura (Procrastinates sleeping until 6 AM)",
            "1000 Aura (Decent sigma grindset detected)",
            "1200 Aura (Always blames lag for skill issue)",
            "1500 Aura (Professional grass avoider)",
            "2000 Aura (Keyboard warrior level 99)",

            // High / Sigma / Epic Aura
            "+5000 Aura (Eats cereal with water, ultimate sigma grindset)",
            "+6000 Aura (Fixes bugs by deleting code)",
            "+7000 Aura (Never reads patch notes, wins anyway)",
            "+8000 Aura (Blinks in Morse code)",
            "+9000 Aura (IT'S OVER 9000 AURA BRO!)",
            "+10000 Aura (Wakes up early just to sleep longer)",
            "+15000 Aura (Uses dark mode light source)",
            "+20000 Aura (Absolute gigachad jawline energy)",
            "+25000 Aura (Speaks fluent sarcasm)",
            "+30000 Aura (Does pushups while playing hard games)",
            "+40000 Aura (Breaths pure oxygen and confidence)",
            "+50000 Aura (Main character plot armor equipped)",
            "+75000 Aura (Admin of the universe)",
            "+100000 Aura (Bro is literally Batman... in his dreams)",
            "+500000 Aura (Defies gravity just by walking)",
            "+1000000 Aura (God mode unlocked, trust me bro)",
            "Legendary Meme Lord (Braincells left the chat completely)",
            "Infinite Aura (Bro transcended human limits, trust me bro)"
        ];

        const randomAura = fakeLevels[Math.floor(Math.random() * fakeLevels.length)];

        const responseMessage = `🤖 **TrustMeBro AI Scanner**\nScanning aura for **${target.username}**... 100% real info (I swear).\n\n🧠 **AI Brain Analysis:** ${randomAura}\n💡 **Trust Score:** 0.1% (Totally legit)`;

        await interaction.reply({ content: responseMessage });
    },
};
