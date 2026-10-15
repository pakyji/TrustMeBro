// Text for fun commands in English (en), Urdu (ur), Italian (it) and Hindi (hi).
// Commands that produce text accept a "language" option. Unknown languages fall back to English.

const LANGUAGES = {
    en: 'English',
    ur: 'اردو (Urdu)',
    it: 'Italiano',
    hi: 'हिन्दी (Hindi)',
};

const LANGUAGE_CHOICES = Object.entries(LANGUAGES).map(([value, name]) => ({ name, value }));

function pickLang(lang) {
    return LANGUAGES[lang] ? lang : 'en';
}

const EIGHT_BALL = {
    en: { q: 'Question', a: 'Answer', answers: ['Yes, definitely.', 'Without a doubt.', 'Most likely.', 'Signs point to yes.', 'Ask again later.', 'Cannot predict that right now.', "Don't count on it.", 'My reply is no.', 'Very doubtful.', 'Bro, obviously yes.'] },
    ur: { q: 'سوال', a: 'جواب', answers: ['ہاں، بالکل۔', 'بغیر کسی شک کے۔', 'زیادہ تر امکان ہے۔', 'نشانیاں ہاں کی طرف ہیں۔', 'بعد میں دوبارہ پوچھو۔', 'ابھی کچھ کہنا مشکل ہے۔', 'اس پر بھروسہ مت کرو۔', 'میرا جواب نہیں ہے۔', 'بہت مشکوک ہے۔', 'بھائی، ظاہر ہے ہاں۔'] },
    it: { q: 'Domanda', a: 'Risposta', answers: ['Sì, assolutamente.', 'Senza dubbio.', 'Molto probabile.', 'Tutto indica di sì.', 'Chiedi di nuovo più tardi.', 'Non posso prevederlo ora.', 'Non contarci troppo.', 'La mia risposta è no.', 'Molto dubbio.', 'Bro, ovviamente sì.'] },
    hi: { q: 'सवाल', a: 'जवाब', answers: ['हाँ, बिल्कुल।', 'बिना किसी शक के।', 'ज़्यादातर संभावना है।', 'संकेत हाँ की ओर हैं।', 'बाद में फिर पूछो।', 'अभी कुछ कहना मुश्किल है।', 'इस पर भरोसा मत करो।', 'मेरा जवाब नहीं है।', 'बहुत संदिग्ध है।', 'भाई, साफ़ तौर पर हाँ।'] },
};

const JOKES = {
    en: ["Why don't skeletons fight each other? They don't have the guts.", 'I told my wife she should embrace her mistakes. She gave me a hug.', 'Why did the scarecrow win an award? He was outstanding in his field.', "I'm reading a book about anti-gravity. It's impossible to put down.", "Why don't eggs tell jokes? They'd crack each other up."],
    ur: ['ڈھانچے آپس میں کیوں نہیں لڑتے؟ ان میں ہمت ہی نہیں ہوتی۔', 'میں نے بیوی سے کہا تمہیں اپنی غلطیوں کو گلے لگانا چاہیے۔ اس نے مجھے جپھی دے دی۔', 'کھیت والا پتلا انعام کیوں جیت گیا؟ کیونکہ وہ اپنے شعبے میں کمال تھا۔', 'میں ایک کتاب پڑھ رہا ہوں جو کششِ ثقل کے خلاف ہے۔ اسے نیچے رکھنا ناممکن ہے۔', 'انڈے آپس میں لطیفے کیوں نہیں سناتے؟ کیونکہ وہ ایک دوسرے کو توڑ دیتے ہیں۔'],
    it: ['Perché gli scheletri non litigano tra loro? Non hanno il fegato.', 'Ho detto a mia moglie di accettare i suoi errori. Mi ha dato un abbraccio.', 'Perché lo spaventapasseri ha vinto un premio? Era eccezionale nel suo campo.', 'Sto leggendo un libro sulla antigravità. È impossibile da posare.', 'Perché le uova non raccontano barzellette? Si romperebbero dal ridere.'],
    hi: ['कंकाल आपस में क्यों नहीं लड़ते? उनमें हिम्मत ही नहीं होती।', 'मैंने अपनी पत्नी से कहा कि उसे अपनी गलतियों को अपना लेना चाहिए। उसने मुझे गले लगा लिया।', 'बिजूका को अवार्ड क्यों मिला? क्योंकि वो अपने फील्ड में बेमिसाल था।', 'मैं गुरुत्वाकर्षण-विरोधी किताब पढ़ रहा हूँ। उसे नीचे रखना नामुमकिन है।', 'अंडे आपस में जोक्स क्यों नहीं सुनाते? क्योंकि वो एक-दूसरे को तोड़ देते हैं।'],
};

const COMPLIMENTS = {
    en: ['You have a great sense of humour.', 'Your energy is contagious.', 'You make the group chat better.', 'You are more reliable than you think.', 'Your smile can brighten anyone\'s day.', 'You have a good heart.'],
    ur: ['تمہارا مزاح کا احساس کمال کا ہے۔', 'تمہاری انرجی سب کو متاثر کرتی ہے۔', 'تم گروپ چیٹ کو بہتر بنا دیتے ہو۔', 'تم جتنا سمجھتے ہو اس سے زیادہ قابلِ اعتماد ہو۔', 'تمہاری مسکراہٹ کسی کا بھی دن روشن کر سکتی ہے۔', 'تمہارا دل اچھا ہے۔'],
    it: ['Hai un ottimo senso dell\'umorismo.', 'La tua energia è contagiosa.', 'Rendi la chat di gruppo migliore.', 'Sei più affidabile di quanto pensi.', 'Il tuo sorriso può illuminare la giornata di chiunque.', 'Hai un cuore gentile.'],
    hi: ['तुम्हारा हास्य-बोध कमाल का है।', 'तुम्हारी एनर्जी सबको अच्छा महसूस कराती है।', 'तुम ग्रुप चैट को और मज़ेदार बना देते हो।', 'तुम जितना सोचते हो उससे ज़्यादा भरोसेमंद हो।', 'तुम्हारी मुस्कान किसी का भी दिन रोशन कर सकती है।', 'तुम्हारा दिल बहुत अच्छा है।'],
};

const RIZZ = {
    en: ['Are you a magician? Because whenever I look at you, everyone else disappears.', 'Do you have a map? I keep getting lost in your eyes.', 'Is your name Google? Because you have everything I have been searching for.', 'Are you WiFi? Because I am feeling a connection.', 'If you were a fruit, you would be a fine-apple.'],
    ur: ['کیا تم جادوگر ہو؟ کیونکہ جب بھی تمہیں دیکھتا ہوں باقی سب غائب ہو جاتے ہیں۔', 'کیا تمہارے پاس نقشہ ہے؟ میں تمہاری آنکھوں میں کھو جاتا ہوں۔', 'کیا تمہارا نام گوگل ہے؟ کیونکہ جو میں ڈھونڈ رہا تھا وہ سب تمہارے پاس ہے۔', 'کیا تم وائی فائی ہو؟ کیونکہ مجھے کنکشن محسوس ہو رہا ہے۔', 'اگر تم پھل ہوتیں تو بہترین سیب ہوتیں۔'],
    it: ['Sei un mago? Perché ogni volta che ti guardo, tutti gli altri scompaiono.', 'Hai una mappa? Continuo a perdermi nei tuoi occhi.', 'Ti chiami Google? Perché hai tutto quello che stavo cercando.', 'Sei il mio Wi-Fi? Perché sento una connessione speciale.', 'Se fossi un frutto, saresti una mela... decisamente speciale.'],
    hi: ['क्या तुम जादूगर हो? क्योंकि जब भी तुम्हें देखता हूँ, बाकी सब गायब हो जाते हैं।', 'क्या तुम्हारे पास नक्शा है? मैं तुम्हारी आँखों में खो जाता हूँ।', 'क्या तुम्हारा नाम गूगल है? क्योंकि जो मैं ढूंढ रहा था, वो सब तुम्हारे पास है।', 'क्या तुम वाईफाई हो? क्योंकि मुझे एक कनेक्शन महसूस हो रहा है।', 'अगर तुम फल होतीं, तो तुम बेहतरीन सेब होतीं।'],
};

// Each entry is "option A|option B".
const WOULD_YOU_RATHER = {
    en: ['Be able to fly|Be invisible', 'Unlimited pizza|Unlimited biryani', 'Always 10 minutes late|Always 20 minutes early', 'Read minds|See the future', 'Talk to animals|Speak every language'],
    ur: ['اڑ سکنا|غائب ہو جانا', 'لامحدود پیزا|لامحدود بریانی', 'ہمیشہ 10 منٹ لیٹ|ہمیشہ 20 منٹ پہلے', 'ذہن پڑھ سکنا|مستقبل دیکھ سکنا', 'جانوروں سے بات کرنا|ہر زبان بولنا'],
    it: ['Saper volare|Essere invisibile', 'Pizza illimitata|Pasta illimitata', 'Essere sempre 10 minuti in ritardo|Essere sempre 20 minuti in anticipo', 'Leggere nel pensiero|Vedere il futuro', 'Parlare con gli animali|Parlare ogni lingua'],
    hi: ['उड़ना आना|गायब हो जाना', 'अनलिमिटेड बिरयानी|अनलिमिटेड पिज़्ज़ा', 'हमेशा 10 मिनट लेट|हमेशा 20 मिनट पहले', 'दिमाग पढ़ना|भविष्य देखना', 'जानवरों से बात करना|हर भाषा बोलना'],
};

const TRUTH_OR_DARE = {
    en: {
        truth: 'Truth', dare: 'Dare',
        truths: ['What is the most embarrassing song you know all the words to?', 'What is a secret talent you have?', 'What was the last lie you told?', 'What is your biggest fear?'],
        dares: ['Send a fun old photo to the group chat (nothing private).', 'Speak only in rhymes for the next 5 messages.', 'Set your nickname to "Bro of the Day" for 1 hour.', 'Name the last song you listened to.'],
    },
    ur: {
        truth: 'سچ', dare: 'ہمت',
        truths: ['وہ سب سے شرمناک گانا کون سا ہے جس کے سارے بول تمہیں یاد ہیں؟', 'تمہارا کوئی چھپا ہوا ہنر کون سا ہے؟', 'تم نے آخری جھوٹ کون سا بولا تھا؟', 'تمہارا سب سے بڑا خوف کیا ہے؟'],
        dares: ['گروپ چیٹ میں کوئی پرانی مزاحیہ تصویر بھیجو (کوئی ذاتی تصویر نہیں)۔', 'اگلے 5 پیغامات صرف شعروں میں لکھو۔', '1 گھنٹے کے لیے اپنا نک نیم "آج کا بھائی" رکھ لو۔', 'جو آخری گانا سنا ہے اس کا نام لکھو۔'],
    },
    it: {
        truth: 'Verità', dare: 'Sfida',
        truths: ['Qual è la canzone più imbarazzante di cui conosci tutte le parole?', 'Qual è un tuo talento segreto?', 'Qual è stata l\'ultima bugia che hai detto?', 'Qual è la tua paura più grande?'],
        dares: ['Manda una vecchia foto divertente nella chat di gruppo (niente di privato).', 'Scrivi solo in rima per i prossimi 5 messaggi.', 'Cambia il tuo soprannome in "Bro del giorno" per 1 ora.', 'Scrivi il nome dell\'ultima canzone che hai ascoltato.'],
    },
    hi: {
        truth: 'सच', dare: 'चैलेंज',
        truths: ['वो सबसे शर्मनाक गाना कौन सा है जिसके सारे बोल तुम्हें याद हैं?', 'तुम्हारा कोई छुपा हुआ हुनर क्या है?', 'तुमने आखिरी बार कौन सा झूठ बोला था?', 'तुम्हारा सबसे बड़ा डर क्या है?'],
        dares: ['ग्रुप चैट में कोई पुरानी मज़ेदार फोटो भेजो (कोई निजी फोटो नहीं)।', 'अगले 5 मैसेज सिर्फ कविता में लिखो।', '1 घंटे के लिए अपना निकनेम "आज का ब्रो" रखो।', 'आखिरी बार जो गाना सुना, उसका नाम लिखो।'],
    },
};

// Four questions. "answer" is the index of the correct option.
const TRIVIA = {
    en: [
        { q: 'What is the capital of Italy?', options: ['Rome', 'Milan', 'Naples', 'Turin'], answer: 0 },
        { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
        { q: 'What is 12 × 12?', options: ['124', '144', '132', '121'], answer: 1 },
        { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], answer: 1 },
    ],
    ur: [
        { q: 'اٹلی کا دارالحکومت کیا ہے؟', options: ['روم', 'میلان', 'نیپلز', 'ٹیورن'], answer: 0 },
        { q: 'دنیا میں کتنے براعظم ہیں؟', options: ['5', '6', '7', '8'], answer: 2 },
        { q: '12 × 12 کتنے ہوتے ہیں؟', options: ['124', '144', '132', '121'], answer: 1 },
        { q: 'سورج کے سب سے قریب کون سا سیارہ ہے؟', options: ['زہرہ', 'عطارد', 'مریخ', 'زمین'], answer: 1 },
    ],
    it: [
        { q: 'Qual è la capitale dell\'Italia?', options: ['Roma', 'Milano', 'Napoli', 'Torino'], answer: 0 },
        { q: 'Quanti continenti ci sono?', options: ['5', '6', '7', '8'], answer: 2 },
        { q: 'Quanto fa 12 × 12?', options: ['124', '144', '132', '121'], answer: 1 },
        { q: 'Quale pianeta è più vicino al Sole?', options: ['Venere', 'Mercurio', 'Marte', 'Terra'], answer: 1 },
    ],
    hi: [
        { q: 'इटली की राजधानी क्या है?', options: ['रोम', 'मिलान', 'नेपल्स', 'टूरिन'], answer: 0 },
        { q: 'दुनिया में कितने महाद्वीप हैं?', options: ['5', '6', '7', '8'], answer: 2 },
        { q: '12 × 12 कितना होता है?', options: ['124', '144', '132', '121'], answer: 1 },
        { q: 'सूर्य के सबसे नज़दीक कौन सा ग्रह है?', options: ['शुक्र', 'बुध', 'मंगल', 'पृथ्वी'], answer: 1 },
    ],
};

const HUG = {
    en: (a, b) => `${a} gives ${b} a big hug 🤗`,
    ur: (a, b) => `${a} نے ${b} کو زور دار جپھی دی 🤗`,
    it: (a, b) => `${a} abbraccia ${b} forte 🤗`,
    hi: (a, b) => `${a} ने ${b} को ज़ोर से गले लगाया 🤗`,
};

function randomItem(list) {
    const crypto = require('crypto');
    return list[crypto.randomInt(list.length)];
}

module.exports = {
    LANGUAGES,
    LANGUAGE_CHOICES,
    pickLang,
    EIGHT_BALL,
    JOKES,
    COMPLIMENTS,
    RIZZ,
    WOULD_YOU_RATHER,
    TRUTH_OR_DARE,
    TRIVIA,
    HUG,
    randomItem,
};
