import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type LocalizedContent = {
  locale: 'en' | 'hi' | 'gu';
  name: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  applicationSteps: string[];
  conditions: string[];
  keywords: string[];
};

type SchemeSeed = {
  slug: string;
  governmentLevel: 'central' | 'state';
  department: string;
  category: string;
  status: 'active';
  availableStates: string[];
  applicationUrl?: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  sortOrder: number;
  contents: LocalizedContent[];
};

const VERIFIED_AT = '2026-09-25T00:00:00.000Z';

const schemes: SchemeSeed[] = [
  {
    slug: 'pm-kisan-samman-nidhi',
    governmentLevel: 'central',
    department: 'Department of Agriculture and Farmers Welfare, Government of India',
    category: 'financial-assistance',
    status: 'active',
    availableStates: ['Gujarat'],
    applicationUrl: 'https://pmkisan.gov.in/RegistrationFormupdated.aspx',
    sourceUrl: 'https://pmkisan.gov.in/',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 10,
    contents: [
      {
        locale: 'en',
        name: 'PM-KISAN Samman Nidhi',
        shortDescription: 'Income support for eligible landholding farmer families through direct benefit transfer.',
        description: 'PM-KISAN is a Central Sector Scheme that provides income support to eligible landholding farmer families. The official portal states that support is ₹6,000 per year in three equal instalments, subject to the scheme guidelines and exclusions.',
        benefits: [
          '₹6,000 per year in three equal instalments for eligible farmer families.',
          'Benefit is transferred directly to the beneficiary bank account.',
        ],
        eligibility: [
          'Landholding farmer families identified as eligible under the PM-KISAN guidelines.',
          'The definition of family includes husband, wife and minor children.',
          'Several exclusion categories apply, including specified institutional landholders, certain government employees/pensioners, income-tax payers and specified professionals.',
        ],
        documents: [
          'Aadhaar details are required for Aadhaar authentication during new farmer registration.',
          'Mobile number and state details are requested in the official registration form.',
          'Keep bank and landholding details available when completing the official registration process.',
        ],
        applicationSteps: [
          'Open the official PM-KISAN New Farmer Registration page.',
          'Enter the requested Aadhaar and mobile details and select the state.',
          'Complete Aadhaar authentication and submit the registration information.',
          'Check the application or beneficiary status on the official PM-KISAN portal.',
        ],
        conditions: [
          'eKYC is mandatory for PM-KISAN registered farmers according to the official portal.',
          'Eligibility is determined under the current PM-KISAN guidelines and exclusion criteria.',
          'Always verify the latest status and requirements on the official portal before applying.',
        ],
        keywords: ['pm kisan', 'pm-kisan', 'samman nidhi', 'income support', 'farmer'],
      },
      {
        locale: 'hi',
        name: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)',
        shortDescription: 'पात्र भूमिधारक किसान परिवारों को सीधे लाभ अंतरण के माध्यम से आय सहायता।',
        description: 'PM-KISAN केंद्र सरकार की योजना है, जिसके तहत पात्र भूमिधारक किसान परिवारों को आय सहायता दी जाती है। आधिकारिक पोर्टल के अनुसार, योजना के अंतर्गत दिशानिर्देशों और अपवर्जन शर्तों के अधीन ₹6,000 प्रति वर्ष तीन समान किस्तों में दिए जाते हैं।',
        benefits: [
          'पात्र किसान परिवारों को ₹6,000 प्रति वर्ष तीन समान किस्तों में।',
          'लाभ सीधे लाभार्थी के बैंक खाते में भेजा जाता है।',
        ],
        eligibility: [
          'PM-KISAN दिशानिर्देशों के अनुसार पात्र भूमिधारक किसान परिवार।',
          'परिवार में पति, पत्नी और नाबालिग बच्चे शामिल होते हैं।',
          'कुछ संस्थागत भूमिधारक, कुछ सरकारी कर्मचारी/पेंशनभोगी, आयकरदाता और कुछ पेशेवर अपवर्जित श्रेणियों में आते हैं।',
        ],
        documents: [
          'नई किसान पंजीकरण प्रक्रिया में आधार प्रमाणीकरण के लिए आधार विवरण आवश्यक है।',
          'आधिकारिक पंजीकरण फॉर्म में मोबाइल नंबर और राज्य की जानकारी मांगी जाती है।',
          'पंजीकरण पूरा करते समय बैंक और भूमि संबंधी विवरण उपलब्ध रखें।',
        ],
        applicationSteps: [
          'आधिकारिक PM-KISAN नए किसान पंजीकरण पेज को खोलें।',
          'मांगी गई आधार और मोबाइल जानकारी भरें तथा राज्य चुनें।',
          'आधार प्रमाणीकरण पूरा करके पंजीकरण जानकारी जमा करें।',
          'आधिकारिक PM-KISAN पोर्टल पर आवेदन या लाभार्थी स्थिति जांचें।',
        ],
        conditions: [
          'आधिकारिक पोर्टल के अनुसार PM-KISAN पंजीकृत किसानों के लिए eKYC अनिवार्य है।',
          'पात्रता वर्तमान PM-KISAN दिशानिर्देशों और अपवर्जन शर्तों के अनुसार तय होती है।',
          'आवेदन से पहले आधिकारिक पोर्टल पर नवीनतम स्थिति और शर्तें जांचें।',
        ],
        keywords: ['पीएम किसान', 'सम्मान निधि', 'आय सहायता', 'किसान'],
      },
      {
        locale: 'gu',
        name: 'પ્રધાનમંત્રી કિસાન સન્માન નિધિ (PM-KISAN)',
        shortDescription: 'પાત્ર જમીનધારક ખેડૂત પરિવારોને સીધી લાભ હસ્તાંતરણ દ્વારા આવક સહાય.',
        description: 'PM-KISAN કેન્દ્ર સરકારની યોજના છે, જેમાં પાત્ર જમીનધારક ખેડૂત પરિવારોને આવક સહાય આપવામાં આવે છે. સત્તાવાર પોર્ટલ મુજબ, યોજનાની માર્ગદર્શિકા અને અપાત્રતા શરતોને આધીન રહીને દર વર્ષે ₹6,000 ત્રણ સમાન હપ્તામાં આપવામાં આવે છે.',
        benefits: [
          'પાત્ર ખેડૂત પરિવારોને દર વર્ષે ₹6,000 ત્રણ સમાન હપ્તામાં.',
          'લાભ સીધો લાભાર્થીના બેંક ખાતામાં જમા થાય છે.',
        ],
        eligibility: [
          'PM-KISANની માર્ગદર્શિકા મુજબ પાત્ર જમીનધારક ખેડૂત પરિવારો.',
          'પરિવારમાં પતિ, પત્ની અને સગીર બાળકોનો સમાવેશ થાય છે.',
          'કેટલાક સંસ્થાકીય જમીનધારકો, ચોક્કસ સરકારી કર્મચારીઓ/પેન્શનરો, આવકવેરો ભરનારા અને ચોક્કસ વ્યવસાયિકો અપાત્ર શ્રેણીમાં આવે છે.',
        ],
        documents: [
          'નવા ખેડૂત નોંધણી દરમિયાન આધાર ચકાસણી માટે આધારની વિગતો જરૂરી છે.',
          'સત્તાવાર નોંધણી ફોર્મમાં મોબાઇલ નંબર અને રાજ્યની વિગતો માંગવામાં આવે છે.',
          'નોંધણી કરતી વખતે બેંક અને જમીન સંબંધિત વિગતો ઉપલબ્ધ રાખો.',
        ],
        applicationSteps: [
          'સત્તાવાર PM-KISAN નવા ખેડૂત નોંધણી પેજ ખોલો.',
          'માગવામાં આવેલી આધાર અને મોબાઇલ વિગતો ભરો અને રાજ્ય પસંદ કરો.',
          'આધાર ચકાસણી પૂર્ણ કરીને નોંધણીની માહિતી સબમિટ કરો.',
          'સત્તાવાર PM-KISAN પોર્ટલ પર અરજી અથવા લાભાર્થીની સ્થિતિ તપાસો.',
        ],
        conditions: [
          'સત્તાવાર પોર્ટલ મુજબ PM-KISANમાં નોંધાયેલા ખેડૂતો માટે eKYC ફરજિયાત છે.',
          'પાત્રતા વર્તમાન PM-KISAN માર્ગદર્શિકા અને અપાત્રતા શરતો મુજબ નક્કી થાય છે.',
          'અરજી કરતા પહેલાં સત્તાવાર પોર્ટલ પર નવીનતમ સ્થિતિ અને શરતો તપાસો.',
        ],
        keywords: ['પીએમ કિસાન', 'સન્માન નિધિ', 'આવક સહાય', 'ખેડૂત'],
      },
    ],
  },
  {
    slug: 'pradhan-mantri-fasal-bima-yojana',
    governmentLevel: 'central',
    department: 'Ministry of Agriculture and Farmers Welfare, Government of India',
    category: 'farmer-insurance',
    status: 'active',
    availableStates: ['Gujarat'],
    applicationUrl: 'https://pmfby.gov.in/',
    sourceUrl: 'https://pmfby.gov.in/',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 20,
    contents: [
      {
        locale: 'en',
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        shortDescription: 'Crop insurance support against notified crop losses and specified natural risks.',
        description: 'PMFBY provides crop insurance cover against specified non-preventable natural risks and crop losses, subject to notified crops, areas, seasonality and the current scheme rules.',
        benefits: [
          'Insurance cover for eligible notified crops against covered crop-loss risks.',
          'Farmer premium is capped at 2% for Kharif food and oilseed crops, 1.5% for Rabi food and oilseed crops, and 5% for annual commercial and horticultural crops under the official scheme features.',
        ],
        eligibility: [
          'Eligibility depends on the crop, area and season notified for the scheme.',
          'The official scheme features state that loanee farmers obtaining crop loans/KCC for notified crops are covered compulsorily, while non-loanee farmers with insurable interest can participate voluntarily.',
        ],
        documents: [
          'The official farmer registration portal requests farmer identity, mobile, residential, farmer and bank-account details.',
          'Additional documents or records may be required according to the notified crop, state process and insurer/bank channel.',
        ],
        applicationSteps: [
          'Check the current PMFBY notification for the crop, area and season.',
          'Use the official PMFBY portal to review registration, premium and status information.',
          'For Gujarat, follow the state-specific enrollment route because the PMFBY portal states that direct online enrollment through NCIP is not available for Gujarat.',
          'Keep the application or policy reference and report losses through the official channel within the applicable rules.',
        ],
        conditions: [
          'Coverage, notified crops, areas, cut-off dates and seasonality are subject to current notifications.',
          'Do not assume that every crop or every farmer is automatically insured.',
          'Verify the current Gujarat enrollment route and season deadline before applying.',
        ],
        keywords: ['pmfby', 'crop insurance', 'fasal bima', 'insurance', 'crop loss'],
      },
      {
        locale: 'hi',
        name: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
        shortDescription: 'अधिसूचित फसलों और निर्धारित प्राकृतिक जोखिमों से होने वाले नुकसान के लिए फसल बीमा सहायता।',
        description: 'PMFBY अधिसूचित फसलों के लिए निर्धारित गैर-रोकथाम योग्य प्राकृतिक जोखिमों और फसल नुकसान के विरुद्ध बीमा कवर देता है। कवरेज वर्तमान अधिसूचित फसल, क्षेत्र, मौसम और योजना नियमों पर निर्भर करता है।',
        benefits: [
          'पात्र अधिसूचित फसलों के लिए कवर किए गए जोखिमों से फसल नुकसान पर बीमा सहायता।',
          'आधिकारिक योजना विशेषताओं के अनुसार किसान का अधिकतम प्रीमियम खरीफ खाद्यान्न/तिलहन के लिए 2%, रबी खाद्यान्न/तिलहन के लिए 1.5% और वार्षिक वाणिज्यिक/बागवानी फसलों के लिए 5% है।',
        ],
        eligibility: [
          'पात्रता अधिसूचित फसल, क्षेत्र और मौसम पर निर्भर करती है।',
          'आधिकारिक योजना विशेषताओं के अनुसार अधिसूचित फसलों के लिए फसल ऋण/KCC लेने वाले ऋणी किसान अनिवार्य कवरेज में आते हैं, जबकि बीमा योग्य हित वाले गैर-ऋणी किसान स्वेच्छा से शामिल हो सकते हैं।',
        ],
        documents: [
          'आधिकारिक किसान पंजीकरण पोर्टल पर किसान की पहचान, मोबाइल, पता, किसान और बैंक खाते की जानकारी मांगी जाती है।',
          'अतिरिक्त दस्तावेज अधिसूचित फसल, राज्य प्रक्रिया और बैंक/बीमा चैनल के अनुसार मांगे जा सकते हैं।',
        ],
        applicationSteps: [
          'फसल, क्षेत्र और मौसम के लिए वर्तमान PMFBY अधिसूचना जांचें।',
          'पंजीकरण, प्रीमियम और स्थिति की जानकारी के लिए आधिकारिक PMFBY पोर्टल देखें।',
          'गुजरात के लिए राज्य की निर्धारित आवेदन प्रक्रिया अपनाएं, क्योंकि PMFBY पोर्टल बताता है कि गुजरात में NCIP के माध्यम से सीधा ऑनलाइन नामांकन उपलब्ध नहीं है।',
          'आवेदन या पॉलिसी संदर्भ सुरक्षित रखें और लागू नियमों के अनुसार नुकसान की सूचना दें।',
        ],
        conditions: [
          'कवरेज, अधिसूचित फसल, क्षेत्र, अंतिम तिथि और मौसम वर्तमान अधिसूचनाओं पर निर्भर हैं।',
          'हर फसल या हर किसान अपने-आप बीमित है, ऐसा न मानें।',
          'आवेदन से पहले गुजरात की वर्तमान नामांकन प्रक्रिया और मौसम की अंतिम तिथि जांचें।',
        ],
        keywords: ['पीएमएफबीवाई', 'फसल बीमा', 'बीमा', 'फसल नुकसान'],
      },
      {
        locale: 'gu',
        name: 'પ્રધાનમંત્રી ફસલ બીમા યોજના (PMFBY)',
        shortDescription: 'અધિસૂચિત પાકો અને નિર્ધારિત કુદરતી જોખમોથી થતા પાક નુકસાન માટે પાક વીમા સહાય.',
        description: 'PMFBY અધિસૂચિત પાકોને નિર્ધારિત અટકાવી ન શકાય તેવા કુદરતી જોખમો અને પાક નુકસાન સામે વીમા કવર આપે છે. કવરેજ વર્તમાન અધિસૂચિત પાક, વિસ્તાર, મોસમ અને યોજનાના નિયમો પર આધારિત છે.',
        benefits: [
          'પાત્ર અધિસૂચિત પાકોને આવરી લેવાયેલા જોખમોથી થતા નુકસાન સામે વીમા કવર.',
          'સત્તાવાર યોજના મુજબ ખેડૂતનો મહત્તમ પ્રીમિયમ ખરીફ ખાદ્ય/તેલબિયાં પાક માટે 2%, રબી ખાદ્ય/તેલબિયાં પાક માટે 1.5% અને વાર્ષિક વ્યાપારી/બાગાયતી પાક માટે 5% છે.',
        ],
        eligibility: [
          'પાત્રતા અધિસૂચિત પાક, વિસ્તાર અને મોસમ પર આધારિત છે.',
          'સત્તાવાર યોજના મુજબ અધિસૂચિત પાક માટે પાક લોન/KCC લેનારા ઋણી ખેડૂતો ફરજિયાત કવરેજમાં આવે છે, જ્યારે વીમાપાત્ર હિત ધરાવતા બિન-ઋણી ખેડૂતો સ્વૈચ્છિક રીતે જોડાઈ શકે છે.',
        ],
        documents: [
          'સત્તાવાર ખેડૂત નોંધણી પોર્ટલ પર ખેડૂતની ઓળખ, મોબાઇલ, સરનામું, ખેડૂત અને બેંક ખાતાની વિગતો માંગવામાં આવે છે.',
          'વધારાના દસ્તાવેજો પાક, રાજ્યની પ્રક્રિયા અને બેંક/વીમા ચેનલ મુજબ જરૂરી હોઈ શકે છે.',
        ],
        applicationSteps: [
          'પાક, વિસ્તાર અને મોસમ માટેની વર્તમાન PMFBY અધિસૂચના તપાસો.',
          'નોંધણી, પ્રીમિયમ અને સ્થિતિ માટે સત્તાવાર PMFBY પોર્ટલ જુઓ.',
          'ગુજરાત માટે રાજ્યની નિર્ધારિત અરજી પ્રક્રિયા અનુસરો, કારણ કે PMFBY પોર્ટલ મુજબ ગુજરાતમાં NCIP દ્વારા સીધી ઓનલાઈન નોંધણી ઉપલબ્ધ નથી.',
          'અરજી અથવા પોલિસી સંદર્ભ સાચવી રાખો અને લાગુ નિયમો મુજબ નુકસાનની જાણ કરો.',
        ],
        conditions: [
          'કવરેજ, અધિસૂચિત પાક, વિસ્તાર, અંતિમ તારીખ અને મોસમ વર્તમાન અધિસૂચનાઓ પર આધારિત છે.',
          'દરેક પાક અથવા દરેક ખેડૂત આપમેળે વીમિત છે એવું માનશો નહીં.',
          'અરજી પહેલાં ગુજરાતની વર્તમાન નોંધણી પ્રક્રિયા અને મોસમની અંતિમ તારીખ તપાસો.',
        ],
        keywords: ['પીએમએફબીવાય', 'પાક વીમો', 'વીમો', 'પાક નુકસાન'],
      },
    ],
  },
  {
    slug: 'kisan-credit-card',
    governmentLevel: 'central',
    department: 'Ministry of Agriculture and Farmers Welfare, Government of India',
    category: 'financial-assistance',
    status: 'active',
    availableStates: ['Gujarat'],
    sourceUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 30,
    contents: [
      {
        locale: 'en',
        name: 'Kisan Credit Card (KCC)',
        shortDescription: 'Timely and adequate credit support for crop cultivation and eligible allied agricultural needs.',
        description: 'The Kisan Credit Card scheme provides farmers with a simplified credit channel for cultivation and specified agricultural and allied needs through participating banks.',
        benefits: [
          'Credit support for short-term cultivation requirements.',
          'Support can include post-harvest expenses, produce marketing loans, farm-asset working capital and eligible investment credit.',
          'The official myScheme page describes 2% interest subvention and 3% prompt repayment incentive under the scheme framework, making the effective rate 4% per annum for the applicable credit.',
        ],
        eligibility: [
          'Individual or joint-borrower owner cultivators.',
          'Tenant farmers, oral lessees and sharecroppers.',
          'Eligible farmer SHGs and Joint Liability Groups.',
        ],
        documents: [
          'Application form.',
          'Passport-size photographs.',
          'Identity proof such as Aadhaar, voter identity card, passport or driving licence.',
          'Address proof.',
          'Certified proof of landholding where applicable.',
          'Cropping pattern with acreage.',
          'Additional security documents may apply above the applicable loan limit.',
        ],
        applicationSteps: [
          'Visit the website of the bank where you want to apply.',
          'Select the Kisan Credit Card option and open the application page.',
          'Fill in the requested details and submit the application.',
          'Keep the application reference number and respond to the bank for the remaining process if requested.',
        ],
        conditions: [
          'The implementing bank may apply institution- and location-specific procedures within the scheme framework.',
          'Interest and security conditions can depend on the applicable credit limit and bank rules.',
          'Verify the latest terms with the participating bank before accepting credit.',
        ],
        keywords: ['kcc', 'kisan credit card', 'farm credit', 'agriculture loan'],
      },
      {
        locale: 'hi',
        name: 'किसान क्रेडिट कार्ड (KCC)',
        shortDescription: 'फसल खेती और पात्र कृषि-संबंधित जरूरतों के लिए समय पर ऋण सहायता।',
        description: 'किसान क्रेडिट कार्ड योजना भाग लेने वाले बैंकों के माध्यम से खेती और निर्धारित कृषि तथा संबद्ध जरूरतों के लिए सरल ऋण सुविधा प्रदान करती है।',
        benefits: [
          'फसल उत्पादन की अल्पकालिक जरूरतों के लिए ऋण सहायता।',
          'कटाई के बाद के खर्च, उपज विपणन ऋण, कृषि परिसंपत्तियों के कार्यशील पूंजी खर्च और पात्र निवेश ऋण के लिए सहायता।',
          'आधिकारिक myScheme पेज के अनुसार योजना ढांचे में 2% ब्याज सबवेंशन और 3% समय पर भुगतान प्रोत्साहन का प्रावधान है, जिससे लागू ऋण पर प्रभावी दर 4% प्रति वर्ष हो सकती है।',
        ],
        eligibility: [
          'व्यक्तिगत या संयुक्त उधारकर्ता भूमिधारक किसान।',
          'किरायेदार किसान, मौखिक पट्टेदार और बटाईदार।',
          'पात्र किसान SHG और संयुक्त देयता समूह।',
        ],
        documents: [
          'आवेदन पत्र।',
          'पासपोर्ट आकार की फोटो।',
          'आधार, मतदाता पहचान पत्र, पासपोर्ट या ड्राइविंग लाइसेंस जैसे पहचान प्रमाण।',
          'पते का प्रमाण।',
          'जहां लागू हो, प्रमाणित भूमि स्वामित्व प्रमाण।',
          'फसल पैटर्न और क्षेत्रफल।',
          'लागू ऋण सीमा से अधिक होने पर अतिरिक्त सुरक्षा दस्तावेज मांगे जा सकते हैं।',
        ],
        applicationSteps: [
          'जिस बैंक में आवेदन करना है उसकी वेबसाइट खोलें।',
          'किसान क्रेडिट कार्ड विकल्प चुनकर आवेदन पेज खोलें।',
          'मांगी गई जानकारी भरकर आवेदन जमा करें।',
          'आवेदन संदर्भ संख्या सुरक्षित रखें और बैंक द्वारा मांगी गई आगे की प्रक्रिया पूरी करें।',
        ],
        conditions: [
          'योजना के ढांचे के भीतर बैंक अपनी संस्था और स्थान के अनुसार प्रक्रिया अपना सकता है।',
          'ब्याज और सुरक्षा शर्तें ऋण सीमा और बैंक के नियमों पर निर्भर कर सकती हैं।',
          'ऋण स्वीकार करने से पहले भाग लेने वाले बैंक से नवीनतम शर्तें जांचें।',
        ],
        keywords: ['केसीसी', 'किसान क्रेडिट कार्ड', 'कृषि ऋण', 'किसान ऋण'],
      },
      {
        locale: 'gu',
        name: 'કિસાન ક્રેડિટ કાર્ડ (KCC)',
        shortDescription: 'પાક ખેતી અને પાત્ર કૃષિ સંબંધિત જરૂરિયાતો માટે સમયસર ધિરાણ સહાય.',
        description: 'કિસાન ક્રેડિટ કાર્ડ યોજના ભાગ લેનારી બેંકો મારફતે ખેતી તથા નિર્ધારિત કૃષિ અને સંલગ્ન જરૂરિયાતો માટે સરળ ધિરાણ સુવિધા આપે છે.',
        benefits: [
          'પાકની ખેતી માટેની ટૂંકા ગાળાની જરૂરિયાતો માટે ધિરાણ સહાય.',
          'લણણી પછીનો ખર્ચ, ઉપજ માર્કેટિંગ લોન, ખેતીની સંપત્તિ માટે કાર્યકારી મૂડી અને પાત્ર રોકાણ ધિરાણ માટે સહાય.',
          'સત્તાવાર myScheme પેજ મુજબ યોજનાના માળખામાં 2% વ્યાજ સહાય અને 3% સમયસર ચુકવણી પ્રોત્સાહન છે, જેથી લાગુ ધિરાણ પર અસરકારક દર 4% પ્રતિ વર્ષ થઈ શકે છે.',
        ],
        eligibility: [
          'વ્યક્તિગત અથવા સંયુક્ત ઉધાર લેનારા જમીનધારક ખેડૂતો.',
          'ભાડૂત ખેડૂતો, મૌખિક પટ્ટેદારો અને ભાગીદારીથી ખેતી કરતા ખેડૂતો.',
          'પાત્ર ખેડૂત SHG અને Joint Liability Group.',
        ],
        documents: [
          'અરજી ફોર્મ.',
          'પાસપોર્ટ સાઇઝના ફોટોગ્રાફ.',
          'આધાર, મતદાર ઓળખપત્ર, પાસપોર્ટ અથવા ડ્રાઇવિંગ લાઇસન્સ જેવા ઓળખ પુરાવા.',
          'સરનામાનો પુરાવો.',
          'જ્યાં લાગુ પડે ત્યાં પ્રમાણિત જમીનધારણનો પુરાવો.',
          'પાક પેટર્ન અને જમીનનું ક્ષેત્રફળ.',
          'લાગુ ધિરાણ મર્યાદા કરતાં વધુ લોન માટે વધારાના સુરક્ષા દસ્તાવેજો જરૂરી થઈ શકે છે.',
        ],
        applicationSteps: [
          'જે બેંકમાં અરજી કરવી છે તેની વેબસાઇટ ખોલો.',
          'કિસાન ક્રેડિટ કાર્ડ વિકલ્પ પસંદ કરીને અરજી પેજ ખોલો.',
          'માગેલી વિગતો ભરીને અરજી સબમિટ કરો.',
          'અરજી સંદર્ભ નંબર સાચવો અને બેંક માંગે તે આગળની પ્રક્રિયા પૂર્ણ કરો.',
        ],
        conditions: [
          'યોજનાના માળખામાં બેંક પોતાની સંસ્થા અને વિસ્તાર મુજબ પ્રક્રિયા અપનાવી શકે છે.',
          'વ્યાજ અને સુરક્ષા શરતો ધિરાણ મર્યાદા અને બેંકના નિયમો પર આધારિત હોઈ શકે છે.',
          'ધિરાણ સ્વીકારતા પહેલાં ભાગ લેનારી બેંક પાસેથી નવીનતમ શરતો તપાસો.',
        ],
        keywords: ['કેસીસી', 'કિસાન ક્રેડિટ કાર્ડ', 'કૃષિ લોન', 'ખેડૂત ધિરાણ'],
      },
    ],
  },
  {
    slug: 'pmksy-per-drop-more-crop',
    governmentLevel: 'central',
    department: 'Department of Agriculture and Farmers Welfare, Government of India',
    category: 'irrigation',
    status: 'active',
    availableStates: ['Gujarat'],
    sourceUrl: 'https://pmksy.gov.in/microirrigation/Archive/Revised%20PDMC%20GL%202021.pdf',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 40,
    contents: [
      {
        locale: 'en',
        name: 'PMKSY — Per Drop More Crop',
        shortDescription: 'Micro-irrigation support focused on better water-use efficiency at farm level.',
        description: 'Per Drop More Crop is a component of Pradhan Mantri Krishi Sinchayee Yojana focused on improving farm-level water-use efficiency through micro-irrigation such as drip and sprinkler systems.',
        benefits: [
          'Supports adoption of micro-irrigation technologies such as drip and sprinkler systems.',
          'Aims to improve water-use efficiency and promote precision water management.',
          'The official guidelines also support micro-level water storage and water conservation/management activities under the component.',
        ],
        eligibility: [
          'Farmer participation is implemented through state-level plans and the applicable PMKSY guidelines.',
          'Actual assistance and application conditions depend on the current state implementation and approved plan.',
        ],
        documents: [
          'The exact document list is determined by the implementing state and current application process.',
          'Check the current Gujarat agriculture or i-Khedut application instructions before preparing documents.',
        ],
        applicationSteps: [
          'Review the current PMKSY Per Drop More Crop information and the Gujarat implementation route.',
          'Check the current Gujarat agriculture or i-Khedut portal for an open application component.',
          'Read the component-specific eligibility and document instructions before submitting an application.',
        ],
        conditions: [
          'Availability and assistance are subject to state plans, approved components and current guidelines.',
          'Do not assume a particular subsidy percentage or amount without checking the current Gujarat notification.',
        ],
        keywords: ['pmksy', 'per drop more crop', 'drip irrigation', 'sprinkler', 'micro irrigation'],
      },
      {
        locale: 'hi',
        name: 'PMKSY — प्रति बूंद अधिक फसल',
        shortDescription: 'खेत स्तर पर जल उपयोग दक्षता बढ़ाने के लिए सूक्ष्म सिंचाई सहायता।',
        description: 'प्रति बूंद अधिक फसल, प्रधानमंत्री कृषि सिंचाई योजना का एक घटक है, जिसका उद्देश्य ड्रिप और स्प्रिंकलर जैसी सूक्ष्म सिंचाई के माध्यम से खेत स्तर पर जल उपयोग दक्षता बढ़ाना है।',
        benefits: [
          'ड्रिप और स्प्रिंकलर जैसी सूक्ष्म सिंचाई तकनीकों को अपनाने में सहायता।',
          'जल उपयोग दक्षता और सटीक जल प्रबंधन को बढ़ावा देना।',
          'आधिकारिक दिशानिर्देशों में सूक्ष्म स्तर पर जल भंडारण और जल संरक्षण/प्रबंधन गतिविधियों का भी प्रावधान है।',
        ],
        eligibility: [
          'किसानों की भागीदारी राज्य स्तर की योजनाओं और लागू PMKSY दिशानिर्देशों के अनुसार होती है।',
          'वास्तविक सहायता और आवेदन शर्तें वर्तमान राज्य कार्यान्वयन और स्वीकृत योजना पर निर्भर करती हैं।',
        ],
        documents: [
          'दस्तावेजों की सटीक सूची राज्य के वर्तमान आवेदन तंत्र द्वारा निर्धारित की जाती है।',
          'दस्तावेज तैयार करने से पहले गुजरात कृषि विभाग या i-Khedut की वर्तमान आवेदन सूचना जांचें।',
        ],
        applicationSteps: [
          'PMKSY प्रति बूंद अधिक फसल की वर्तमान जानकारी और गुजरात की कार्यान्वयन प्रक्रिया देखें।',
          'खुले आवेदन घटक के लिए गुजरात कृषि या i-Khedut पोर्टल जांचें।',
          'आवेदन से पहले घटक-विशिष्ट पात्रता और दस्तावेज निर्देश पढ़ें।',
        ],
        conditions: [
          'उपलब्धता और सहायता राज्य की योजनाओं, स्वीकृत घटकों और वर्तमान दिशानिर्देशों पर निर्भर है।',
          'वर्तमान गुजरात अधिसूचना जांचे बिना किसी विशेष सब्सिडी प्रतिशत या राशि को निश्चित न मानें।',
        ],
        keywords: ['पीएमकेएसवाई', 'प्रति बूंद अधिक फसल', 'ड्रिप सिंचाई', 'स्प्रिंकलर', 'सूक्ष्म सिंचाई'],
      },
      {
        locale: 'gu',
        name: 'PMKSY — પ્રતિ ટીપું વધુ પાક',
        shortDescription: 'ખેતર સ્તરે પાણીના કાર્યક્ષમ ઉપયોગ માટે સૂક્ષ્મ સિંચાઈ સહાય.',
        description: 'પ્રતિ ટીપું વધુ પાક, પ્રધાનમંત્રી કૃષિ સિંચાઈ યોજનાનો એક ઘટક છે, જે ડ્રિપ અને સ્પ્રિંકલર જેવી સૂક્ષ્મ સિંચાઈ દ્વારા ખેતર સ્તરે પાણીના કાર્યક્ષમ ઉપયોગને સુધારવા પર કેન્દ્રિત છે.',
        benefits: [
          'ડ્રિપ અને સ્પ્રિંકલર જેવી સૂક્ષ્મ સિંચાઈ ટેક્નોલોજી અપનાવવા સહાય.',
          'પાણીના કાર્યક્ષમ ઉપયોગ અને ચોકસાઈ આધારિત પાણી વ્યવસ્થાપનને પ્રોત્સાહન.',
          'સત્તાવાર માર્ગદર્શિકામાં સૂક્ષ્મ સ્તરે પાણી સંગ્રહ અને પાણી સંરક્ષણ/વ્યવસ્થાપન પ્રવૃત્તિઓનો પણ સમાવેશ થાય છે.',
        ],
        eligibility: [
          'ખેડૂતોની ભાગીદારી રાજ્ય સ્તરની યોજનાઓ અને લાગુ PMKSY માર્ગદર્શિકા દ્વારા અમલમાં આવે છે.',
          'વાસ્તવિક સહાય અને અરજીની શરતો વર્તમાન રાજ્ય અમલીકરણ અને મંજૂર યોજના પર આધારિત છે.',
        ],
        documents: [
          'ચોક્કસ દસ્તાવેજોની યાદી રાજ્યની વર્તમાન અરજી પ્રક્રિયા નક્કી કરે છે.',
          'દસ્તાવેજો તૈયાર કરતાં પહેલાં ગુજરાત કૃષિ વિભાગ અથવા i-Khedutની વર્તમાન અરજી સૂચનાઓ તપાસો.',
        ],
        applicationSteps: [
          'PMKSY પ્રતિ ટીપું વધુ પાકની વર્તમાન માહિતી અને ગુજરાતની અમલીકરણ પ્રક્રિયા જુઓ.',
          'ખુલ્લા અરજી ઘટક માટે ગુજરાત કૃષિ અથવા i-Khedut પોર્ટલ તપાસો.',
          'અરજી કરતા પહેલાં ઘટક-વિશિષ્ટ પાત્રતા અને દસ્તાવેજ સૂચનાઓ વાંચો.',
        ],
        conditions: [
          'ઉપલબ્ધતા અને સહાય રાજ્યની યોજનાઓ, મંજૂર ઘટકો અને વર્તમાન માર્ગદર્શિકા પર આધારિત છે.',
          'વર્તમાન ગુજરાત અધિસૂચના તપાસ્યા વગર કોઈ ચોક્કસ સબસિડી ટકાવારી અથવા રકમ નિશ્ચિત ન માનશો.',
        ],
        keywords: ['પીએમકેએસવાય', 'પ્રતિ ટીપું વધુ પાક', 'ડ્રિપ સિંચાઈ', 'સ્પ્રિંકલર', 'સૂક્ષ્મ સિંચાઈ'],
      },
    ],
  },
  {
    slug: 'soil-health-card',
    governmentLevel: 'central',
    department: 'Department of Agriculture and Farmers Welfare, Government of India',
    category: 'soil-fertilizer',
    status: 'active',
    availableStates: ['Gujarat'],
    sourceUrl: 'https://soilhealth.dac.gov.in/',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 50,
    contents: [
      {
        locale: 'en',
        name: 'Soil Health Card Scheme',
        shortDescription: 'Soil testing and nutrient recommendations to help farmers manage soil health.',
        description: 'The Soil Health Card provides information about the nutrient status of a farmer’s holding and advice on nutrient doses and soil amendments based on soil-test information.',
        benefits: [
          'A report of the soil nutrient status of the farm holding.',
          'Recommendations on nutrient doses and soil amendments based on the test results.',
          'The official API guidance describes the card as covering 12 soil parameters.',
        ],
        eligibility: [
          'The scheme is implemented through the agriculture departments of states and union territories.',
          'Farmers can use the soil-testing service through the applicable state process and soil-testing laboratories.',
        ],
        documents: [
          'The exact documents or registration details depend on the state soil-sampling and testing process.',
          'Follow the current instructions of the concerned agriculture department or soil-testing laboratory.',
        ],
        applicationSteps: [
          'Use the Soil Health Card portal or the applicable state agriculture process to find the service information.',
          'A soil sample is collected and sent for testing through the approved process.',
          'Review the generated Soil Health Card and its nutrient recommendations.',
          'Use the official recommendations and consult the agriculture department when clarification is needed.',
        ],
        conditions: [
          'Recommendations are based on soil-test results and state recommendations.',
          'The official support material describes a three-year cycle for Soil Health Cards.',
          'Do not replace a soil-test recommendation with a generic fertilizer dose.',
        ],
        keywords: ['soil health card', 'soil testing', 'soil nutrient', 'fertilizer', 'soil'],
      },
      {
        locale: 'hi',
        name: 'मृदा स्वास्थ्य कार्ड योजना',
        shortDescription: 'मिट्टी की जांच और पोषक तत्वों की सिफारिशों के माध्यम से मिट्टी का बेहतर प्रबंधन।',
        description: 'मृदा स्वास्थ्य कार्ड किसान की भूमि की मिट्टी में पोषक तत्वों की स्थिति और मिट्टी जांच के आधार पर पोषक तत्वों की मात्रा तथा मिट्टी सुधार की सलाह देता है।',
        benefits: [
          'खेत की मिट्टी में पोषक तत्वों की स्थिति की रिपोर्ट।',
          'जांच के परिणाम के आधार पर पोषक तत्वों और मिट्टी सुधार की सिफारिश।',
          'आधिकारिक API मार्गदर्शन के अनुसार कार्ड में 12 मिट्टी पैरामीटर शामिल होते हैं।',
        ],
        eligibility: [
          'यह योजना राज्यों और केंद्र शासित प्रदेशों के कृषि विभागों के माध्यम से लागू होती है।',
          'किसान राज्य की प्रक्रिया और मिट्टी जांच प्रयोगशाला के माध्यम से मिट्टी जांच सेवा ले सकते हैं।',
        ],
        documents: [
          'सटीक दस्तावेज या पंजीकरण विवरण राज्य की मिट्टी नमूना और जांच प्रक्रिया पर निर्भर करते हैं।',
          'संबंधित कृषि विभाग या मिट्टी जांच प्रयोगशाला के वर्तमान निर्देशों का पालन करें।',
        ],
        applicationSteps: [
          'सेवा की जानकारी के लिए Soil Health Card पोर्टल या राज्य कृषि विभाग की प्रक्रिया देखें।',
          'स्वीकृत प्रक्रिया के अनुसार मिट्टी का नमूना लिया जाता है और जांच के लिए भेजा जाता है।',
          'तैयार मृदा स्वास्थ्य कार्ड और पोषक तत्वों की सिफारिश देखें।',
          'आधिकारिक सिफारिशों का पालन करें और जरूरत होने पर कृषि विभाग से सलाह लें।',
        ],
        conditions: [
          'सिफारिशें मिट्टी जांच के परिणाम और राज्य की सिफारिशों पर आधारित होती हैं।',
          'आधिकारिक सहायता सामग्री में मृदा स्वास्थ्य कार्ड के लिए तीन वर्ष का चक्र बताया गया है।',
          'मिट्टी जांच की सिफारिश के स्थान पर सामान्य उर्वरक मात्रा का उपयोग न करें।',
        ],
        keywords: ['मृदा स्वास्थ्य कार्ड', 'मिट्टी जांच', 'पोषक तत्व', 'उर्वरक', 'मिट्टी'],
      },
      {
        locale: 'gu',
        name: 'સોઇલ હેલ્થ કાર્ડ યોજના',
        shortDescription: 'જમીનની તંદુરસ્તી સંભાળવા માટે માટી પરીક્ષણ અને પોષક તત્વોની ભલામણ.',
        description: 'સોઇલ હેલ્થ કાર્ડ ખેડૂતની જમીનમાં પોષક તત્વોની સ્થિતિ વિશે માહિતી આપે છે અને માટી પરીક્ષણના આધારે પોષક તત્વોની માત્રા તથા જમીન સુધારાની ભલામણ કરે છે.',
        benefits: [
          'ખેતરની જમીનમાં પોષક તત્વોની સ્થિતિનો અહેવાલ.',
          'પરીક્ષણના પરિણામના આધારે પોષક તત્વો અને જમીન સુધારાની ભલામણ.',
          'સત્તાવાર API માર્ગદર્શિકા મુજબ કાર્ડમાં 12 માટી પરિમાણોનો સમાવેશ થાય છે.',
        ],
        eligibility: [
          'આ યોજના રાજ્યો અને કેન્દ્રશાસિત પ્રદેશોના કૃષિ વિભાગો મારફતે અમલમાં આવે છે.',
          'ખેડૂતો રાજ્યની પ્રક્રિયા અને માટી પરીક્ષણ પ્રયોગશાળાઓ મારફતે માટી પરીક્ષણ સેવા મેળવી શકે છે.',
        ],
        documents: [
          'ચોક્કસ દસ્તાવેજો અથવા નોંધણીની વિગતો રાજ્યની માટી નમૂના અને પરીક્ષણ પ્રક્રિયા પર આધારિત છે.',
          'સંબંધિત કૃષિ વિભાગ અથવા માટી પરીક્ષણ પ્રયોગશાળાની વર્તમાન સૂચનાઓ અનુસરો.',
        ],
        applicationSteps: [
          'સેવાની માહિતી માટે Soil Health Card પોર્ટલ અથવા રાજ્ય કૃષિ વિભાગની પ્રક્રિયા જુઓ.',
          'મંજૂર પ્રક્રિયા મુજબ માટીનો નમૂનો લેવામાં આવે છે અને પરીક્ષણ માટે મોકલવામાં આવે છે.',
          'તૈયાર સોઇલ હેલ્થ કાર્ડ અને પોષક તત્વોની ભલામણ તપાસો.',
          'સત્તાવાર ભલામણોનો ઉપયોગ કરો અને જરૂર પડે ત્યારે કૃષિ વિભાગની સલાહ લો.',
        ],
        conditions: [
          'ભલામણો માટી પરીક્ષણના પરિણામો અને રાજ્યની ભલામણો પર આધારિત હોય છે.',
          'સત્તાવાર સહાય સામગ્રીમાં સોઇલ હેલ્થ કાર્ડ માટે ત્રણ વર્ષનો ચક્ર જણાવવામાં આવ્યો છે.',
          'માટી પરીક્ષણની ભલામણના બદલે સામાન્ય ખાતરની માત્રા નક્કી કરીને ઉપયોગ ન કરો.',
        ],
        keywords: ['સોઇલ હેલ્થ કાર્ડ', 'માટી પરીક્ષણ', 'પોષક તત્વો', 'ખાતર', 'માટી'],
      },
    ],
  },
  {
    slug: 'pm-formalisation-micro-food-processing-enterprises',
    governmentLevel: 'central',
    department: 'Ministry of Food Processing Industries, Government of India',
    category: 'other-agriculture-support',
    status: 'active',
    availableStates: ['Gujarat'],
    applicationUrl: 'https://pmfme.mofpi.gov.in/pmfme/',
    sourceUrl: 'https://pmfme.mofpi.gov.in/pmfme/',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 60,
    contents: [
      {
        locale: 'en',
        name: 'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
        shortDescription: 'Support for eligible micro food-processing enterprises and groups connected with the agri-food value chain.',
        description: 'PMFME supports eligible micro food-processing enterprises and groups such as FPOs, SHGs and cooperatives. The official portal currently publishes application and support information, including credit-linked capital subsidy components.',
        benefits: [
          'Credit-linked capital subsidy of 35% of eligible project cost, up to ₹10 lakh per unit for eligible individual or other listed enterprise categories.',
          'Common infrastructure support for eligible groups can provide 35% of eligible project cost up to ₹3 crore.',
          'Seed capital support of ₹40,000 per SHG member is listed for working capital and small tools, subject to the scheme conditions.',
        ],
        eligibility: [
          'Eligibility depends on the beneficiary type and the applicable PMFME guidelines.',
          'The official portal lists individuals, proprietorships, partnerships, FPOs, NGOs, cooperatives, SHGs and private limited companies among supported categories for relevant components.',
          'FPOs, FPCs, cooperatives, SHGs and government agencies can be covered under the common-infrastructure component subject to conditions.',
        ],
        documents: [
          'Documents depend on the applicant type and selected PMFME component.',
          'Use the official PMFME application instructions for the current document checklist.',
        ],
        applicationSteps: [
          'Open the official PMFME portal.',
          'Review the current applicant registration and component information.',
          'Register or log in using the official portal and complete the application requested for the relevant component.',
          'Follow the portal instructions for project, finance and supporting-document submission.',
        ],
        conditions: [
          'Support is subject to the current PMFME guidelines and component-specific eligibility.',
          'The subsidy is credit-linked for the applicable components and is not an unconditional cash payment.',
          'Check the official portal for the current application window and state-specific implementation information.',
        ],
        keywords: ['pmfme', 'food processing', 'micro food processing', 'fpo', 'shg', 'processing subsidy'],
      },
      {
        locale: 'hi',
        name: 'प्रधानमंत्री सूक्ष्म खाद्य प्रसंस्करण उद्यम औपचारिकीकरण (PMFME)',
        shortDescription: 'कृषि-खाद्य मूल्य श्रृंखला से जुड़े पात्र सूक्ष्म खाद्य प्रसंस्करण उद्यमों और समूहों के लिए सहायता।',
        description: 'PMFME पात्र सूक्ष्म खाद्य प्रसंस्करण उद्यमों तथा FPO, SHG और सहकारी संस्थाओं जैसे समूहों को सहायता देता है। आधिकारिक पोर्टल पर वर्तमान आवेदन और सहायता जानकारी उपलब्ध है, जिसमें क्रेडिट-लिंक्ड पूंजी सब्सिडी घटक शामिल हैं।',
        benefits: [
          'पात्र व्यक्तिगत या अन्य सूचीबद्ध उद्यम श्रेणियों के लिए पात्र परियोजना लागत का 35% तक, अधिकतम ₹10 लाख प्रति इकाई क्रेडिट-लिंक्ड पूंजी सब्सिडी।',
          'पात्र समूहों के लिए सामान्य अवसंरचना घटक में पात्र परियोजना लागत का 35% तक, अधिकतम ₹3 करोड़।',
          'कार्यशील पूंजी और छोटे उपकरणों के लिए SHG सदस्य को ₹40,000 तक सीड कैपिटल सहायता, योजना शर्तों के अधीन।',
        ],
        eligibility: [
          'पात्रता लाभार्थी के प्रकार और लागू PMFME दिशानिर्देशों पर निर्भर करती है।',
          'आधिकारिक पोर्टल संबंधित घटकों के लिए व्यक्तियों, प्रोपराइटरशिप, पार्टनरशिप, FPO, NGO, सहकारी, SHG और प्राइवेट लिमिटेड कंपनियों जैसी श्रेणियां सूचीबद्ध करता है।',
          'सामान्य अवसंरचना घटक में FPO, FPC, सहकारी, SHG और सरकारी एजेंसियां शर्तों के अधीन शामिल हो सकती हैं।',
        ],
        documents: [
          'दस्तावेज आवेदक के प्रकार और चुने गए PMFME घटक पर निर्भर करते हैं।',
          'वर्तमान दस्तावेज सूची के लिए आधिकारिक PMFME आवेदन निर्देश देखें।',
        ],
        applicationSteps: [
          'आधिकारिक PMFME पोर्टल खोलें।',
          'वर्तमान आवेदक पंजीकरण और संबंधित घटक की जानकारी देखें।',
          'आधिकारिक पोर्टल पर पंजीकरण या लॉगिन करके संबंधित घटक का आवेदन पूरा करें।',
          'परियोजना, वित्त और सहायक दस्तावेज जमा करने के लिए पोर्टल के निर्देशों का पालन करें।',
        ],
        conditions: [
          'सहायता वर्तमान PMFME दिशानिर्देश और घटक-विशिष्ट पात्रता के अधीन है।',
          'लागू घटकों में सब्सिडी क्रेडिट-लिंक्ड है और बिना शर्त नकद भुगतान नहीं है।',
          'वर्तमान आवेदन अवधि और राज्य-विशिष्ट जानकारी के लिए आधिकारिक पोर्टल जांचें।',
        ],
        keywords: ['पीएमएफएमई', 'खाद्य प्रसंस्करण', 'सूक्ष्म खाद्य प्रसंस्करण', 'एफपीओ', 'एसएचजी'],
      },
      {
        locale: 'gu',
        name: 'પ્રધાનમંત્રી સૂક્ષ્મ ફૂડ પ્રોસેસિંગ એન્ટરપ્રાઇઝનું ઔપચારિકીકરણ (PMFME)',
        shortDescription: 'કૃષિ-ખાદ્ય મૂલ્ય શ્રૃંખલા સાથે જોડાયેલા પાત્ર સૂક્ષ્મ ફૂડ પ્રોસેસિંગ ઉદ્યોગો અને જૂથો માટે સહાય.',
        description: 'PMFME પાત્ર સૂક્ષ્મ ફૂડ પ્રોસેસિંગ ઉદ્યોગો તથા FPO, SHG અને સહકારી સંસ્થાઓ જેવા જૂથોને સહાય આપે છે. સત્તાવાર પોર્ટલ પર વર્તમાન અરજી અને સહાયની માહિતી ઉપલબ્ધ છે, જેમાં ક્રેડિટ-લિન્ક્ડ મૂડી સબસિડીના ઘટકો સામેલ છે.',
        benefits: [
          'પાત્ર વ્યક્તિગત અથવા અન્ય સૂચિબદ્ધ ઉદ્યોગ શ્રેણીઓ માટે પાત્ર પ્રોજેક્ટ ખર્ચના 35% સુધી, મહત્તમ ₹10 લાખ પ્રતિ યુનિટ ક્રેડિટ-લિન્ક્ડ મૂડી સબસિડી.',
          'પાત્ર જૂથો માટે કોમન ઇન્ફ્રાસ્ટ્રક્ચર ઘટકમાં પાત્ર પ્રોજેક્ટ ખર્ચના 35% સુધી, મહત્તમ ₹3 કરોડ.',
          'કાર્યકારી મૂડી અને નાના સાધનો માટે SHG સભ્યદીઠ ₹40,000 સુધી સીડ કેપિટલ સહાય, યોજનાની શરતોને આધીન.',
        ],
        eligibility: [
          'પાત્રતા લાભાર્થીના પ્રકાર અને લાગુ PMFME માર્ગદર્શિકા પર આધારિત છે.',
          'સત્તાવાર પોર્ટલ સંબંધિત ઘટકો માટે વ્યક્તિઓ, પ્રોપ્રાઇટરશિપ, પાર્ટનરશિપ, FPO, NGO, સહકારી, SHG અને પ્રાઇવેટ લિમિટેડ કંપની જેવી શ્રેણીઓ દર્શાવે છે.',
          'કોમન ઇન્ફ્રાસ્ટ્રક્ચર ઘટકમાં FPO, FPC, સહકારી, SHG અને સરકારી એજન્સીઓ શરતોને આધીન સામેલ થઈ શકે છે.',
        ],
        documents: [
          'દસ્તાવેજો અરજદારના પ્રકાર અને પસંદ કરેલા PMFME ઘટક પર આધારિત છે.',
          'વર્તમાન દસ્તાવેજોની યાદી માટે સત્તાવાર PMFME અરજી સૂચનાઓ તપાસો.',
        ],
        applicationSteps: [
          'સત્તાવાર PMFME પોર્ટલ ખોલો.',
          'વર્તમાન અરજદાર નોંધણી અને સંબંધિત ઘટકની માહિતી તપાસો.',
          'સત્તાવાર પોર્ટલ પર નોંધણી અથવા લોગિન કરીને સંબંધિત ઘટકની અરજી પૂર્ણ કરો.',
          'પ્રોજેક્ટ, નાણાકીય અને સહાયક દસ્તાવેજો સબમિટ કરવા પોર્ટલની સૂચનાઓ અનુસરો.',
        ],
        conditions: [
          'સહાય વર્તમાન PMFME માર્ગદર્શિકા અને ઘટક-વિશિષ્ટ પાત્રતાને આધીન છે.',
          'લાગુ ઘટકોમાં સબસિડી ક્રેડિટ-લિન્ક્ડ છે અને બિનશરતી રોકડ ચુકવણી નથી.',
          'વર્તમાન અરજી સમયગાળા અને રાજ્ય-વિશિષ્ટ માહિતી માટે સત્તાવાર પોર્ટલ તપાસો.',
        ],
        keywords: ['પીએમએફએમઈ', 'ફૂડ પ્રોસેસિંગ', 'સૂક્ષ્મ ફૂડ પ્રોસેસિંગ', 'એફપીઓ', 'એસએચજી'],
      },
    ],
  },
  {
    slug: 'gujarat-mission-for-cotton-productivity-icm-cst-2026',
    governmentLevel: 'state',
    department: 'Agriculture, Farmers Welfare and Co-operation Department, Government of Gujarat',
    category: 'seeds-inputs',
    status: 'closed',
    availableStates: ['Gujarat'],
    applicationUrl: 'https://ikhedut.gujarat.gov.in/',
    sourceUrl: 'https://ikhedut.gujarat.gov.in/Public/frm_Public_Contacts.aspx',
    lastVerifiedAt: VERIFIED_AT,
    sortOrder: 70,
    contents: [
      {
        locale: 'en',
        name: 'Gujarat Mission for Cotton Productivity — ICM & CST',
        shortDescription: 'A Gujarat agriculture support component for Integrated Crop Management and Close Spacing Technology in cotton.',
        description: 'The Gujarat Agriculture Department published a 2026 notice for applications under the Mission for Cotton Productivity (cotton revolution), covering Integrated Crop Management (ICM) and Close Spacing Technology (CST) components.',
        benefits: [
          'Support is associated with the notified ICM and CST components under the Mission for Cotton Productivity.',
          'The official notice provides the applicable cotton spacing requirement for the CST component.',
        ],
        eligibility: [
          'The official Gujarat notice states that cotton cultivation under the scheme guidelines must follow the prescribed spacing for the relevant component.',
          'For the cited CST notice, the required spacing is 90 × 30 cm or 90 × 60 cm.',
        ],
        documents: [
          'The current public notice does not provide a complete document checklist in the published notice used for this entry.',
          'Check the i-Khedut application instructions for the exact document list when the component is open again.',
        ],
        applicationSteps: [
          'Open the official Gujarat i-Khedut portal.',
          'Check whether the Mission for Cotton Productivity component is open for applications.',
          'Read the current component instructions and submit through the official portal when the application window is open.',
        ],
        conditions: [
          'The official notice stated that applications for the ICM and CST components could be submitted until 24 July 2026.',
          'The listed application window has passed as of the last verification date, so this entry is shown as closed.',
          'A future application window may have different conditions; verify the latest i-Khedut notice before applying.',
        ],
        keywords: ['gujarat cotton', 'cotton productivity', 'icm', 'cst', 'close spacing technology'],
      },
      {
        locale: 'hi',
        name: 'गुजरात कपास उत्पादकता मिशन — ICM और CST',
        shortDescription: 'गुजरात में कपास के लिए एकीकृत फसल प्रबंधन और क्लोज स्पेसिंग टेक्नोलॉजी से जुड़ा कृषि सहायता घटक।',
        description: 'गुजरात कृषि विभाग ने 2026 में कपास उत्पादकता मिशन के तहत Integrated Crop Management (ICM) और Close Spacing Technology (CST) घटकों के लिए आवेदन संबंधी सूचना प्रकाशित की थी।',
        benefits: [
          'सहायता कपास उत्पादकता मिशन के अधिसूचित ICM और CST घटकों से जुड़ी है।',
          'आधिकारिक सूचना में CST घटक के लिए लागू कपास बुवाई दूरी बताई गई है।',
        ],
        eligibility: [
          'आधिकारिक गुजरात सूचना के अनुसार योजना के तहत कपास की खेती में संबंधित घटक के लिए निर्धारित दूरी का पालन होना चाहिए।',
          'उल्लिखित CST सूचना में दूरी 90 × 30 सेमी या 90 × 60 सेमी बताई गई है।',
        ],
        documents: [
          'उपयोग की गई सार्वजनिक सूचना में पूरी दस्तावेज सूची उपलब्ध नहीं है।',
          'घटक दोबारा खुलने पर सटीक दस्तावेज सूची के लिए i-Khedut आवेदन निर्देश देखें।',
        ],
        applicationSteps: [
          'आधिकारिक गुजरात i-Khedut पोर्टल खोलें।',
          'देखें कि कपास उत्पादकता मिशन का घटक आवेदन के लिए खुला है या नहीं।',
          'वर्तमान घटक निर्देश पढ़कर आवेदन अवधि खुली होने पर आधिकारिक पोर्टल से आवेदन करें।',
        ],
        conditions: [
          'आधिकारिक सूचना के अनुसार ICM और CST घटकों के लिए आवेदन 24 जुलाई 2026 तक किए जा सकते थे।',
          'अंतिम समीक्षा तिथि तक यह आवेदन अवधि समाप्त हो चुकी है, इसलिए यह योजना बंद के रूप में दिखाई जाती है।',
          'भविष्य की आवेदन अवधि में शर्तें बदल सकती हैं; आवेदन से पहले नवीनतम i-Khedut सूचना जांचें।',
        ],
        keywords: ['गुजरात कपास', 'कपास उत्पादकता', 'आईसीएम', 'सीएसटी', 'क्लोज स्पेसिंग'],
      },
      {
        locale: 'gu',
        name: 'ગુજરાત મિશન ફોર કોટન પ્રોડક્ટિવિટી — ICM અને CST',
        shortDescription: 'ગુજરાતમાં કપાસ માટે Integrated Crop Management અને Close Spacing Technology સાથે જોડાયેલ કૃષિ સહાય ઘટક.',
        description: 'ગુજરાત કૃષિ વિભાગે 2026માં Mission for Cotton Productivity હેઠળ Integrated Crop Management (ICM) અને Close Spacing Technology (CST) ઘટકો માટે અરજી અંગેની સૂચના પ્રકાશિત કરી હતી.',
        benefits: [
          'સહાય Mission for Cotton Productivityના અધિસૂચિત ICM અને CST ઘટકો સાથે જોડાયેલી છે.',
          'સત્તાવાર સૂચનામાં CST ઘટક માટે લાગુ કપાસ વાવેતરની અંતરવ્યવસ્થા દર્શાવવામાં આવી છે.',
        ],
        eligibility: [
          'સત્તાવાર ગુજરાત સૂચના મુજબ યોજનાના માર્ગદર્શિકા હેઠળ કપાસનું વાવેતર સંબંધિત ઘટક માટે નિર્ધારિત અંતર મુજબ હોવું જોઈએ.',
          'ઉલ્લેખિત CST સૂચનામાં 90 × 30 સે.મી. અથવા 90 × 60 સે.મી.નું અંતર જણાવાયું છે.',
        ],
        documents: [
          'ઉપયોગમાં લેવાયેલી જાહેર સૂચનામાં સંપૂર્ણ દસ્તાવેજોની યાદી ઉપલબ્ધ નથી.',
          'ઘટક ફરીથી ખુલ્યા પછી ચોક્કસ દસ્તાવેજોની યાદી માટે i-Khedutની અરજી સૂચનાઓ તપાસો.',
        ],
        applicationSteps: [
          'સત્તાવાર ગુજરાત i-Khedut પોર્ટલ ખોલો.',
          'Mission for Cotton Productivityનો ઘટક અરજી માટે ખુલ્લો છે કે નહીં તે તપાસો.',
          'વર્તમાન ઘટકની સૂચનાઓ વાંચો અને અરજી સમયગાળો ખુલ્લો હોય ત્યારે સત્તાવાર પોર્ટલ પરથી અરજી કરો.',
        ],
        conditions: [
          'સત્તાવાર સૂચના મુજબ ICM અને CST ઘટકો માટે અરજી 24 જુલાઈ 2026 સુધી કરી શકાતી હતી.',
          'છેલ્લી ચકાસણી તારીખ સુધી આ અરજી સમયગાળો પૂર્ણ થઈ ગયો છે, તેથી આ એન્ટ્રી બંધ તરીકે દર્શાવવામાં આવે છે.',
          'ભવિષ્યની અરજી અવધિમાં શરતો બદલાઈ શકે છે; અરજી પહેલાં નવીનતમ i-Khedut સૂચના તપાસો.',
        ],
        keywords: ['ગુજરાત કપાસ', 'કપાસ ઉત્પાદકતા', 'આઈસીએમ', 'સીએસટી', 'ક્લોઝ સ્પેસિંગ'],
      },
    ],
  }
];

function searchTextFor(content: LocalizedContent): string {
  return [
    content.name,
    content.shortDescription,
    content.description,
    ...content.keywords,
    ...content.benefits,
    ...content.eligibility,
  ]
    .join(' ')
    .trim();
}

async function main() {
  for (const scheme of schemes) {
    const row = await prisma.governmentScheme.upsert({
      where: { slug: scheme.slug },
      update: {
        governmentLevel: scheme.governmentLevel,
        department: scheme.department,
        category: scheme.category,
        status: scheme.status,
        availableStates: scheme.availableStates,
        applicationUrl: scheme.applicationUrl,
        sourceUrl: scheme.sourceUrl,
        lastVerifiedAt: new Date(scheme.lastVerifiedAt),
        isPublished: true,
        sortOrder: scheme.sortOrder,
      },
      create: {
        slug: scheme.slug,
        governmentLevel: scheme.governmentLevel,
        department: scheme.department,
        category: scheme.category,
        status: scheme.status,
        availableStates: scheme.availableStates,
        applicationUrl: scheme.applicationUrl,
        sourceUrl: scheme.sourceUrl,
        lastVerifiedAt: new Date(scheme.lastVerifiedAt),
        isPublished: true,
        sortOrder: scheme.sortOrder,
      },
    });

    for (const content of scheme.contents) {
      await prisma.governmentSchemeContent.upsert({
        where: {
          schemeId_locale: {
            schemeId: row.id,
            locale: content.locale,
          },
        },
        update: {
          name: content.name,
          shortDescription: content.shortDescription,
          description: content.description,
          benefits: content.benefits as Prisma.InputJsonValue,
          eligibility: content.eligibility as Prisma.InputJsonValue,
          documents: content.documents as Prisma.InputJsonValue,
          applicationSteps: content.applicationSteps as Prisma.InputJsonValue,
          conditions: content.conditions as Prisma.InputJsonValue,
          keywords: content.keywords,
          searchText: searchTextFor(content),
        },
        create: {
          schemeId: row.id,
          locale: content.locale,
          name: content.name,
          shortDescription: content.shortDescription,
          description: content.description,
          benefits: content.benefits as Prisma.InputJsonValue,
          eligibility: content.eligibility as Prisma.InputJsonValue,
          documents: content.documents as Prisma.InputJsonValue,
          applicationSteps: content.applicationSteps as Prisma.InputJsonValue,
          conditions: content.conditions as Prisma.InputJsonValue,
          keywords: content.keywords,
          searchText: searchTextFor(content),
        },
      });
    }
  }

  console.log(`Government scheme seed complete: ${schemes.length} schemes × 3 locales.`);
}

main()
  .catch((error: unknown) => {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`Government scheme seed failed (${errorType}).`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
