/**
 * Gujarat Location Dataset (Districts -> Talukas -> Villages).
 *
 * Provides hierarchical structured data for Gujarat administrative subdivisions.
 * Designed for easy client-side dependent dropdown selection and future API replacement.
 */

export interface TalukaData {
  name: string;
  villages: string[];
}

export interface DistrictData {
  name: string;
  talukas: TalukaData[];
}

export const GUJARAT_LOCATIONS: DistrictData[] = [
  {
    name: 'Rajkot',
    talukas: [
      {
        name: 'Jasdan',
        villages: ['Jasdan', 'Atkot', 'Gadhadiya', 'Sanathali', 'Virnagar', 'Jangvad', 'Kamlapur', 'Bhadla', 'Lilapur'],
      },
      {
        name: 'Dhoraji',
        villages: ['Dhoraji', 'Jamkandorna', 'Bhader', 'Supedi', 'Toraniya', 'Zanzmer', 'Farasang', 'Patanvav'],
      },
      {
        name: 'Gondal',
        villages: ['Gondal', 'Gomta', 'Bandhiya', 'Biliwala', 'Shrinathgadh', 'Derdi', 'Moti Khilori', 'Vasavad'],
      },
      {
        name: 'Jetpur',
        villages: ['Jetpur', 'Navagadh', 'Pithadiya', 'Kagvad', 'Mevasa', 'Pedhla', 'Dhebar', 'Monpar'],
      },
      {
        name: 'Kotda Sangani',
        villages: ['Kotda Sangani', 'Ardoi', 'Baghadadiya', 'Rajpara', 'Veraval (Shapar)', 'Naranagadh'],
      },
      {
        name: 'Lodhika',
        villages: ['Lodhika', 'Metoda', 'Ravki', 'Und Khijadiya', 'Pal', 'Chhapra', 'Vagudad'],
      },
      {
        name: 'Paddhari',
        villages: ['Paddhari', 'Targhari', 'Ukharla', 'Khambhala', 'Mota Khijadiya', 'Sarapdad'],
      },
      {
        name: 'Rajkot',
        villages: ['Rajkot', 'Kankot', 'Madhapar', 'Bedi', 'Anandpar', 'Gavridad', 'Hadala', 'Kuvadva', 'Ratanpar'],
      },
      {
        name: 'Upleta',
        villages: ['Upleta', 'Bhayavadar', 'Kolki', 'Dumiyani', 'Paneli Moti', 'Mokal', 'Rabashika', 'Varjang Jalia'],
      },
      {
        name: 'Vinchhiya',
        villages: ['Vinchhiya', 'Pipardi', 'Sompipar', 'Janada', 'Gadhada', 'Hathasani'],
      },
      {
        name: 'Jamkandorna',
        villages: ['Jamkandorna', 'Dhudasiya', 'Chitravad', 'Rampur', 'Matavadi'],
      },
    ],
  },
  {
    name: 'Junagadh',
    talukas: [
      {
        name: 'Mangrol',
        villages: ['Mangrol', 'Sil', 'Arena', 'Lathodra', 'Mangarol Bandar', 'Langarvada', 'Osa Ghed'],
      },
      {
        name: 'Keshod',
        villages: ['Keshod', 'Agatrai', 'Madhavpur', 'Kevadra', 'Jonpur', 'Mevasa', 'Balagam', 'Ajab'],
      },
      {
        name: 'Junagadh',
        villages: ['Junagadh', 'Bilkha', 'Dungarpur', 'Makhiyala', 'Vadal', 'Majevadi', 'Choki'],
      },
      {
        name: 'Manavadar',
        villages: ['Manavadar', 'Bantwa', 'Pajod', 'Mitadi', 'Zinzri', 'Sardargadh'],
      },
      {
        name: 'Mendarda',
        villages: ['Mendarda', 'Alidhar', 'Rajpara', 'Samadhiyala', 'Baradiya', 'Natali'],
      },
      {
        name: 'Vanthali',
        villages: ['Vanthali', 'Koyli', 'Lusala', 'Ravni', 'Shapur', 'Kajilpur'],
      },
      {
        name: 'Visavadar',
        villages: ['Visavadar', 'Bhesan', 'Sarsai', 'Chaparda', 'Monpari', 'Moti Monpari'],
      },
      {
        name: 'Malia',
        villages: ['Malia Hatina', 'Bhanduri', 'Kukaswada', 'Chorwad', 'Zundala', 'Vadala'],
      },
      {
        name: 'Bhesan',
        villages: ['Bhesan', 'Dhorajiya', 'Pasvala', 'Ranpur', 'Sukhpur'],
      },
    ],
  },
  {
    name: 'Amreli',
    talukas: [
      {
        name: 'Savarkundla',
        villages: ['Savarkundla', 'Vijpadi', 'Vanda', 'Khadsali', 'Mitiyala', 'Jeera', 'Bhad', 'Bhavardi'],
      },
      {
        name: 'Lilia',
        villages: ['Lilia', 'Gundaran', 'Bhensan', 'Lilia Mota', 'Eklera', 'Kalyanpur', 'Panchtalavda'],
      },
      {
        name: 'Amreli',
        villages: ['Amreli', 'Babra', 'Bagasara', 'Chalala', 'Chital', 'Gavadka', 'Mota Gokharwala'],
      },
      {
        name: 'Babra',
        villages: ['Babra', 'Chamardi', 'Kotda Pitha', 'Kariyana', 'Garkhadi'],
      },
      {
        name: 'Bagasara',
        villages: ['Bagasara', 'Haliyad', 'Derdi', 'Munjiasar', 'Khadpipali'],
      },
      {
        name: 'Dhari',
        villages: ['Dhari', 'Chalala', 'Khicha', 'Sarasiya', 'Dholarva', 'Virpur'],
      },
      {
        name: 'Jafrabad',
        villages: ['Jafrabad', 'Shiyalbet', 'Rohisa', 'Nageshree', 'Balana', 'Kagvadar'],
      },
      {
        name: 'Rajula',
        villages: ['Rajula', 'Pipavav', 'Kumbhariya', 'Dungar', 'Victor', 'Chhatradi'],
      },
      {
        name: 'Khambha',
        villages: ['Khambha', 'Dhadhni', 'Dedan', 'Umariya', 'Bhad', 'Nava Malaknes'],
      },
      {
        name: 'Kunkavav Vadia',
        villages: ['Vadia', 'Kunkavav', 'Devgam', 'Barwala Baval', 'Sanala'],
      },
    ],
  },
  {
    name: 'Bhavnagar',
    talukas: [
      {
        name: 'Talaja',
        villages: ['Talaja', 'Alang', 'Trapaj', 'Sartanpar', 'Shetrunji', 'Methla', 'Gadhula', 'Borda'],
      },
      {
        name: 'Palitana',
        villages: ['Palitana', 'Gariadhar', 'Rohishala', 'Songadh', 'Jamanvav', 'Valukad', 'Dhajdi'],
      },
      {
        name: 'Bhavnagar',
        villages: ['Bhavnagar', 'Vartej', 'Koliyak', 'Sihor', 'Ghogha', 'Kuda', 'Shampara', 'Bhandar'],
      },
      {
        name: 'Mahuva',
        villages: ['Mahuva', 'Bagdana', 'Katpar', 'Gujarda', 'Talgajarda', 'Bhadrod', 'Dudheri'],
      },
      {
        name: 'Sihor',
        villages: ['Sihor', 'Songadh', 'Tana', 'Gadhula', 'Navagam', 'Rabarka'],
      },
      {
        name: 'Gariadhar',
        villages: ['Gariadhar', 'Parvadi', 'Panchtobra', 'Survilas', 'Luvara'],
      },
      {
        name: 'Ghogha',
        villages: ['Ghogha', 'Kuda', 'Morchand', 'Bhadbhadi', 'Chhaya'],
      },
      {
        name: 'Umrala',
        villages: ['Umrala', 'Dhadhli', 'Bhojavadar', 'Ranghola', 'Chogath'],
      },
      {
        name: 'Vallabhipur',
        villages: ['Vallabhipur', 'Kalyanpur', 'Navagam', 'Chamardi', 'Lakhanka'],
      },
      {
        name: 'Jesar',
        villages: ['Jesar', 'Chiroda', 'Mota Khuntavada', 'Bhadla', 'Ranpar'],
      },
    ],
  },
  {
    name: 'Surendranagar',
    talukas: [
      {
        name: 'Limbdi',
        villages: ['Limbdi', 'Chuda', 'Sayla', 'Raska', 'Panshina', 'Ralol', 'Jansali', 'Bhoika'],
      },
      {
        name: 'Chotila',
        villages: ['Chotila', 'Than', 'Muli', 'Anandpur', 'Reshamiya', 'Bamanbore', 'Ghelarajkot'],
      },
      {
        name: 'Wadhwan',
        villages: ['Wadhwan', 'Dudhrej', 'Surendranagar', 'Kherali', 'Muli Road', 'Bala'],
      },
      {
        name: 'Dhrangadhra',
        villages: ['Dhrangadhra', 'Halvad', 'Sara', 'Kankavati', 'Kondh', 'Gala'],
      },
      {
        name: 'Dasada',
        villages: ['Patdi', 'Dasada', 'Bajana', 'Malvan', 'Zinzuwada', 'Adariyana'],
      },
      {
        name: 'Sayla',
        villages: ['Sayla', 'Dhankaniya', 'Sudamda', 'Mota Sakhpar', 'Thoriyali'],
      },
      {
        name: 'Chuda',
        villages: ['Chuda', 'Bhavanigadh', 'Karmad', 'Sontha', 'Chachana'],
      },
      {
        name: 'Muli',
        villages: ['Muli', 'Digsar', 'Sara', 'Gautamgadh', 'Khatdi'],
      },
      {
        name: 'Thangadh',
        villages: ['Thangadh', 'Songadh', 'Jamwali', 'Amarapar', 'Targhara'],
      },
      {
        name: 'Lakhtar',
        villages: ['Lakhtar', 'Vana', 'Lilapur', 'Talsana', 'Dhanki'],
      },
    ],
  },
  {
    name: 'Morbi',
    talukas: [
      {
        name: 'Wankaner',
        villages: ['Wankaner', 'Sindhavadar', 'Mahika', 'Matel', 'Jaliya', 'Tithwa', 'Kothariya'],
      },
      {
        name: 'Morbi',
        villages: ['Morbi', 'Trajpar', 'Lilapar', 'Mahendranagar', 'Pipali', 'Lakhdhirpur', 'Nava Sadulka'],
      },
      {
        name: 'Halvad',
        villages: ['Halvad', 'Mayurnagar', 'Tikar', 'Dhavana', 'Sara', 'Ranmalpur'],
      },
      {
        name: 'Maliya',
        villages: ['Maliya Miyana', 'Fatepar', 'Kumbhaniya', 'Nava Gam', 'Varsamedi'],
      },
      {
        name: 'Tankara',
        villages: ['Tankara', 'Neknam', 'Bangavadi', 'Mitana', 'Sarvad', 'Kalyanpar'],
      },
    ],
  },
  {
    name: 'Anand',
    talukas: [
      {
        name: 'Borsad',
        villages: ['Borsad', 'Anklav', 'Bochasan', 'Davol', 'Nisraya', 'Vasna', 'Kavitha'],
      },
      {
        name: 'Khambhat',
        villages: ['Khambhat', 'Tarapur', 'Shakarpura', 'Kansari', 'Metpur', 'Gudel'],
      },
      {
        name: 'Anand',
        villages: ['Anand', 'Mogar', 'Bakrol', 'Karamsad', 'Vidyanagar', 'Hadgood', 'Gamdi', 'Chikhodra'],
      },
      {
        name: 'Petlad',
        villages: ['Petlad', 'Sunav', 'Bandhani', 'Nar', 'Dharmaj', 'Porda'],
      },
      {
        name: 'Umreth',
        villages: ['Umreth', 'Dakor', 'Bhalej', 'Thamna', 'Sundalpura', 'Ratanpura'],
      },
      {
        name: 'Sojitra',
        villages: ['Sojitra', 'Malataj', 'Piplav', 'Trambovad', 'Gada', 'Runaj'],
      },
      {
        name: 'Anklav',
        villages: ['Anklav', 'Asarma', 'Bhetasi', 'Gambhira', 'Kanthariya'],
      },
      {
        name: 'Tarapur',
        villages: ['Tarapur', 'Moraj', 'Indranaj', 'Galiyana', 'Tol'],
      },
    ],
  },
  {
    name: 'Mehsana',
    talukas: [
      {
        name: 'Vijapur',
        villages: ['Vijapur', 'Ladol', 'Pilvai', 'Sundhiya', 'Kukarwada', 'Gozaria', 'Kot'],
      },
      {
        name: 'Kadi',
        villages: ['Kadi', 'Nani Kadi', 'Nandasan', 'Borisana', 'Karannagar', 'Jasalpur', 'Kundal'],
      },
      {
        name: 'Mehsana',
        villages: ['Mehsana', 'Visnagar', 'Unjha', 'Vadnagar', 'Kheralu', 'Palavasana', 'Ambaliyasan'],
      },
      {
        name: 'Visnagar',
        villages: ['Visnagar', 'Valam', 'Kada', 'Basana', 'Chitrodipura', 'Sadar']
      },
      {
        name: 'Unjha',
        villages: ['Unjha', 'Aithor', 'Dasaj', 'Kamli', 'Brahmanwada', 'Tunda'],
      },
      {
        name: 'Vadnagar',
        villages: ['Vadnagar', 'Molipur', 'Sipor', 'Kahoda', 'Khatoda'],
      },
      {
        name: 'Kheralu',
        villages: ['Kheralu', 'Chada', 'Dhabha', 'Fatehpura', 'Mandropur'],
      },
      {
        name: 'Satlasana',
        villages: ['Satlasana', 'Kothasana', 'Sudasana', 'Vav', 'Bedasmala'],
      },
      {
        name: 'Becharaji',
        villages: ['Becharaji', 'Sankhari', 'Dedana', 'Suraj', 'Modhera'],
      },
      {
        name: 'Jotana',
        villages: ['Jotana', 'Santhal', 'Kasva', 'Manknaj', 'Suraj'],
      },
    ],
  },
  {
    name: 'Vadodara',
    talukas: [
      {
        name: 'Vadodara',
        villages: ['Vadodara', 'Padra', 'Dabhoi', 'Karjan', 'Waghodia', 'Koyali', 'Ranoli', 'Bajva'],
      },
      {
        name: 'Padra',
        villages: ['Padra', 'Mobha', 'Vadu', 'Mujpur', 'Lati', 'Chokari'],
      },
      {
        name: 'Dabhoi',
        villages: ['Dabhoi', 'Kayavarohan', 'Mandala', 'Bhilapur', 'Vanseti'],
      },
      {
        name: 'Karjan',
        villages: ['Karjan', 'Miyagam', 'Kandari', 'Choranda', 'Valan'],
      },
      {
        name: 'Savli',
        villages: ['Savli', 'Manjusar', 'Deser', 'Samlaya', 'Gothada'],
      },
      {
        name: 'Waghodia',
        villages: ['Waghodia', 'Jarod', 'Gajaravadi', 'Limda', 'Amodar'],
      },
      {
        name: 'Shinor',
        villages: ['Shinor', 'Malsar', 'Sadhli', 'Anandi', 'Barkal'],
      },
      {
        name: 'Desar',
        villages: ['Desar', 'Vakhatpura', 'Vejpur', 'Pandu', 'Limdi'],
      },
    ],
  },
  {
    name: 'Bharuch',
    talukas: [
      {
        name: 'Jhagadia',
        villages: ['Jhagadia', 'Umalla', 'Rajpardi', 'Avidha', 'Asha', 'Fulwadi'],
      },
      {
        name: 'Bharuch',
        villages: ['Bharuch', 'Ankleshwar', 'Hansot', 'Vagra', 'Amod', 'Bholav', 'Zadeshwar'],
      },
      {
        name: 'Ankleshwar',
        villages: ['Ankleshwar', 'Panoli', 'Sajod', 'Mandvabuzarg', 'Kosamdi'],
      },
      {
        name: 'Jambusar',
        villages: ['Jambusar', 'Kavi', 'Magnad', 'Vedach', 'Kahanva'],
      },
      {
        name: 'Vagra',
        villages: ['Vagra', 'Dahej', 'Vilayat', 'Rahiyad', 'Pakhajan'],
      },
      {
        name: 'Amod',
        villages: ['Amod', 'Achhod', 'Ranada', 'Nahier', 'Keshwan'],
      },
      {
        name: 'Hansot',
        villages: ['Hansot', 'Sunevkala', 'Ilav', 'Katpor', 'Vamleshwar'],
      },
      {
        name: 'Netrang',
        villages: ['Netrang', 'Kavachia', 'Baladava', 'Moriyana', 'Bhilwada'],
      },
      {
        name: 'Valia',
        villages: ['Valia', 'Dungri', 'Luna', 'Pithor', 'Desad'],
      },
    ],
  },
  {
    name: 'Navsari',
    talukas: [
      {
        name: 'Navsari',
        villages: ['Navsari', 'Jalalpore', 'Gandevi', 'Chikhli', 'Vansda', 'Mahuvar', 'Matwad'],
      },
      {
        name: 'Gandevi',
        villages: ['Gandevi', 'Bilimora', 'Devsar', 'Amalsad', 'Masa', 'Khadsupa'],
      },
      {
        name: 'Jalalpore',
        villages: ['Jalalpore', 'Maroli', 'Abrama', 'Vesma', 'Tavdi', 'Dandi'],
      },
      {
        name: 'Chikhli',
        villages: ['Chikhli', 'Alipor', 'Samroli', 'Rumla', 'Soldhara', 'Tankal'],
      },
      {
        name: 'Vansda',
        villages: ['Vansda', 'Unai', 'Limzar', 'Zarvan', 'Kandolpada'],
      },
      {
        name: 'Khergam',
        villages: ['Khergam', 'Panikhadak', 'Bhairav', 'Nandarkha', 'Chitali'],
      },
    ],
  },
  {
    name: 'Ahmedabad',
    talukas: [
      {
        name: 'Ahmedabad City',
        villages: ['Ahmedabad', 'Sarkhej', 'Ghatlodiya', 'Vejalpur', 'Bopal', 'Gota', 'Ranip', 'Odhav', 'Naroda'],
      },
      {
        name: 'Daskroi',
        villages: ['Daskroi', 'Aslali', 'Bareja', 'Kuha', 'Gatrad', 'Bhuvaldi', 'Miroli'],
      },
      {
        name: 'Sanand',
        villages: ['Sanand', 'Nidhrad', 'Changodar', 'Chekhla', 'Goraj', 'Mani', 'Telav'],
      },
      {
        name: 'Viramgam',
        villages: ['Viramgam', 'Mandal', 'Detroj', 'Hansalpur', 'Sachana', 'Karakthal'],
      },
      {
        name: 'Dholka',
        villages: ['Dholka', 'Koth', 'Bavalayav', 'Chaloda', 'Rampur', 'Saroda'],
      },
      {
        name: 'Dhandhuka',
        villages: ['Dhandhuka', 'Fedra', 'Tagadi', 'Rayka', 'Khadol', 'Sarval'],
      },
      {
        name: 'Bavla',
        villages: ['Bavla', 'Dholera', 'Salangpur', 'Adval', 'Kavitha', 'Chiyada'],
      },
      {
        name: 'Mandal',
        villages: ['Mandal', 'Trent', 'Zinzuwada Road', 'Nayaka', 'Sitapur'],
      },
      {
        name: 'Detroj-Rampura',
        villages: ['Detroj', 'Rampura', 'Kukvav', 'Bhadana', 'Gunjala'],
      },
      {
        name: 'Dholera',
        villages: ['Dholera', 'Bhangadh', 'Otariya', 'Bavliyari', 'Gogla'],
      },
    ],
  },
  {
    name: 'Surat',
    talukas: [
      {
        name: 'Surat City',
        villages: ['Surat', 'Adajan', 'Katargam', 'Varachha', 'Udhna', 'Rander', 'Althan', 'Pal'],
      },
      {
        name: 'Choryasi',
        villages: ['Hazira', 'Dumas', 'Sachin', 'Ichhapore', 'Bhimrad', 'Magdalla'],
      },
      {
        name: 'Olpad',
        villages: ['Olpad', 'Sayan', 'Kim', 'Karanj', 'Masma', 'Kudiana', 'Saras'],
      },
      {
        name: 'Kamrej',
        villages: ['Kamrej', 'Navagam', 'Kholvad', 'Valak', 'Pasodara', 'Sevni'],
      },
      {
        name: 'Bardoli',
        villages: ['Bardoli', 'Baben', 'Ten', 'Madhi', 'Kadod', 'Afwa'],
      },
      {
        name: 'Mandvi',
        villages: ['Mandvi', 'Tadkeshwar', 'Areth', 'Godavadi', 'Pipalvada'],
      },
      {
        name: 'Mahuva',
        villages: ['Mahuva', 'Karcheliya', 'Anaval', 'Bhoria', 'Dhamrod'],
      },
      {
        name: 'Mangrol',
        villages: ['Mangrol', 'Kosamba', 'Mota Borsara', 'Velachha', 'Mosali'],
      },
      {
        name: 'Palsana',
        villages: ['Palsana', 'Kadodara', 'Chalthan', 'Gangadhara', 'Vankaneda'],
      },
      {
        name: 'Umarpada',
        villages: ['Umarpada', 'Govat', 'Vadi', 'Bilvan', 'Chavda'],
      },
    ],
  },
  {
    name: 'Gandhinagar',
    talukas: [
      {
        name: 'Gandhinagar',
        villages: ['Gandhinagar', 'Pethapur', 'Chiloda', 'Kudasan', 'Raysan', 'Randheja', 'Vavol'],
      },
      {
        name: 'Kalol',
        villages: ['Kalol', 'Chhatral', 'Saij', 'Vadavswami', 'Pansar', 'Khatraj', 'Moti Bhoyan'],
      },
      {
        name: 'Dehgam',
        villages: ['Dehgam', 'Bahiyal', 'Kadadra', 'Rakhial', 'Zundal', 'Vatva'],
      },
      {
        name: 'Mansa',
        villages: ['Mansa', 'Lodra', 'Itadara', 'Amrapur', 'Charada', 'Bapupura'],
      },
    ],
  },
  {
    name: 'Jamnagar',
    talukas: [
      {
        name: 'Jamnagar',
        villages: ['Jamnagar', 'Bedeshwar', 'Dhuvav', 'Aliabada', 'Theba', 'Navagam', 'Moti Banugar'],
      },
      {
        name: 'Lalpur',
        villages: ['Lalpur', 'Padana', 'Meghpar', 'Kansumra', 'Pipar', 'Gop'],
      },
      {
        name: 'Kalavad',
        villages: ['Kalavad', 'Nikava', 'Motavagudad', 'Khandhera', 'Dhudasiya'],
      },
      {
        name: 'Jamjodhpur',
        villages: ['Jamjodhpur', 'Balwa', 'Gadhakda', 'Samana', 'Shekhpat'],
      },
      {
        name: 'Jodiya',
        villages: ['Jodiya', 'Balambha', 'Hadiyana', 'Kunad', 'Kothariya'],
      },
      {
        name: 'Dhrol',
        villages: ['Dhrol', 'Liyala', 'Jayva', 'Manekpar', 'Kharva'],
      },
    ],
  },
  {
    name: 'Kutch',
    talukas: [
      {
        name: 'Bhuj',
        villages: ['Bhuj', 'Madhapar', 'Mirzapar', 'Kukma', 'Sukhpar', 'Khavda', 'Mankuwa'],
      },
      {
        name: 'Gandhidham',
        villages: ['Gandhidham', 'Kandla', 'Adipur', 'Galpadar', 'Padana'],
      },
      {
        name: 'Anjar',
        villages: ['Anjar', 'Sinugra', 'Meghpar', 'Ratnal', 'Dhudhai'],
      },
      {
        name: 'Mandvi',
        villages: ['Mandvi', 'Maska', 'Gundiyali', 'Layja', 'Bidada', 'Koday'],
      },
      {
        name: 'Mundra',
        villages: ['Mundra', 'Baroi', 'Zarpara', 'Pragpar', 'Samaghogha'],
      },
      {
        name: 'Nakhatrana',
        villages: ['Nakhatrana', 'Kotda', 'Ravapar', 'Deshalpar', 'Vithon'],
      },
      {
        name: 'Abdasa',
        villages: ['Naliya', 'Kothara', 'Vithon', 'Jakhau', 'Tera'],
      },
      {
        name: 'Rapar',
        villages: ['Rapar', 'Adesar', 'Gagodar', 'Pragpar', 'Bhimasar'],
      },
      {
        name: 'Bhachau',
        villages: ['Bhachau', 'Samakhiali', 'Chobari', 'Manfara', 'Kabirau'],
      },
      {
        name: 'Lakhpat',
        villages: ['Dayapar', 'Lakhpat', 'Ghaduli', 'Narayan Sarovar', 'Koteshwar'],
      },
    ],
  },
  {
    name: 'Banaskantha',
    talukas: [
      {
        name: 'Palanpur',
        villages: ['Palanpur', 'Gadh', 'Chadotar', 'Chandisar', 'Kanodar', 'Jorapura'],
      },
      {
        name: 'Deesa',
        villages: ['Deesa', 'Bhildi', 'Akhol', 'Rajpur', 'Lorwada', 'Zada'],
      },
      {
        name: 'Dhanera',
        villages: ['Dhanera', 'Thawar', 'Raviya', 'Nenava', 'Dharnodhar'],
      },
      {
        name: 'Tharad',
        villages: ['Tharad', 'Rah', 'Dodgam', 'Piluda', 'Karanpura'],
      },
      {
        name: 'Vav',
        villages: ['Vav', 'Suigam', 'Bhabhar', 'Radhanpur', 'Morwada'],
      },
      {
        name: 'Danta',
        villages: ['Danta', 'Ambaji', 'Hadad', 'Koteshwar', 'Motasada'],
      },
      {
        name: 'Vadgam',
        villages: ['Vadgam', 'Chhapi', 'Majadar', 'Memadpur', 'Mahi'],
      },
      {
        name: 'Dantiwada',
        villages: ['Dantiwada', 'Bhadath', 'Gangu', 'Jegol', 'Ranol'],
      },
      {
        name: 'Kankrej',
        villages: ['Shihori', 'Thara', 'Ranakpur', 'Kamboi', 'Umbri'],
      },
      {
        name: 'Bhabhar',
        villages: ['Bhabhar', 'Sanva', 'Mera', 'Khara', 'Chachasana'],
      },
    ],
  },
  {
    name: 'Patan',
    talukas: [
      {
        name: 'Patan',
        villages: ['Patan', 'Ranuj', 'Balisana', 'Sandesarpati', 'Kungher', 'Vadu'],
      },
      {
        name: 'Siddhpur',
        villages: ['Siddhpur', 'Kakoshi', 'Bindu Sarovar', 'Metrana', 'Nedra'],
      },
      {
        name: 'Chanasma',
        villages: ['Chanasma', 'Dhinoj', 'Lanva', 'Ruppur', 'Jhulasan'],
      },
      {
        name: 'Radhanpur',
        villages: ['Radhanpur', 'Santalpur', 'Sami', 'Shankheshwar', 'Kamalpur'],
      },
      {
        name: 'Harij',
        villages: ['Harij', 'Katra', 'Sankhari', 'Kheroj', 'Jasomav'],
      },
      {
        name: 'Sami',
        villages: ['Sami', 'Varahi', 'Lotiya', 'Mota Joravarpura'],
      },
      {
        name: 'Santalpur',
        villages: ['Santalpur', 'Gadhai', 'Rozu', 'Zazam', 'Piprala'],
      },
      {
        name: 'Shankheshwar',
        villages: ['Shankheshwar', 'Panchasar', 'Mithaghar', 'Kunvar'],
      },
      {
        name: 'Saraswati',
        villages: ['Saraswati', 'Koita', 'Sampra', 'Kimbuva', 'Undra'],
      },
    ],
  },
  {
    name: 'Sabarkantha',
    talukas: [
      {
        name: 'Himatnagar',
        villages: ['Himatnagar', 'Gambhoi', 'Ilol', 'Hapa', 'Raigadh', 'Vavdi'],
      },
      {
        name: 'Idar',
        villages: ['Idar', 'Badoli', 'Laloda', 'Posina', 'Khedbrahma', 'Jadar'],
      },
      {
        name: 'Prantij',
        villages: ['Prantij', 'Salal', 'Poglu', 'Majra', 'Tajpur'],
      },
      {
        name: 'Talod',
        villages: ['Talod', 'Harsol', 'Ranasan', 'Ghorvada', 'Lalpura'],
      },
      {
        name: 'Khedbrahma',
        villages: ['Khedbrahma', 'Poshina', 'Lambadiya', 'Dadhvav', 'Aghiya'],
      },
      {
        name: 'Vadali',
        villages: ['Vadali', 'Dabhala', 'Bhadresar', 'Medh', 'Hathoj'],
      },
      {
        name: 'Vijaynagar',
        villages: ['Vijaynagar', 'Polo Forest', 'Chithoda', 'Antarsuba'],
      },
      {
        name: 'Poshina',
        villages: ['Poshina', 'Kotda', 'Laxmipura', 'Delvada', 'Chhapra'],
      },
    ],
  },
  {
    name: 'Botad',
    talukas: [
      {
        name: 'Botad',
        villages: ['Botad', 'Paliyad', 'Khas', 'Dhankaniya', 'Sarva', 'Tajpar', 'Turkha'],
      },
      {
        name: 'Gadhada',
        villages: ['Gadhada', 'Dhasa', 'Itariya', 'Ningala', 'Vikaliya', 'Patna'],
      },
      {
        name: 'Barwala',
        villages: ['Barwala', 'Polarpur', 'Ranparda', 'Navda', 'Bhadla'],
      },
      {
        name: 'Ranpur',
        villages: ['Ranpur', 'Kinara', 'Kundli', 'Khas', 'Umrala'],
      },
    ],
  },
  {
    name: 'Gir Somnath',
    talukas: [
      {
        name: 'Veraval',
        villages: ['Veraval', 'Somnath', 'Prabhas Patan', 'Inaj', 'Adri', 'Bhalpara'],
      },
      {
        name: 'Talala',
        villages: ['Talala', 'Sasan Gir', 'Borvav', 'Hadmatiya', 'Chitravad', 'Surva'],
      },
      {
        name: 'Kodinar',
        villages: ['Kodinar', 'Harmadiya', 'Mul Dwarka', 'Velan', 'Devli', 'Pedhavada'],
      },
      {
        name: 'Una',
        villages: ['Una', 'Delwada', 'Tad', 'Samter', 'Sanakhada', 'Nathal'],
      },
      {
        name: 'Sutrapada',
        villages: ['Sutrapada', 'Dhamlej', 'Lodhva', 'Moradiya', 'Vavdi'],
      },
      {
        name: 'Gir Gadhada',
        villages: ['Gir Gadhada', 'Dhokadva', 'Fareda', 'Jargali', 'Jamwala'],
      },
    ],
  },
  {
    name: 'Porbandar',
    talukas: [
      {
        name: 'Porbandar',
        villages: ['Porbandar', 'Ranavav', 'Kutiyana', 'Bokhira', 'Chhaya', 'Madhavpur Ghed', 'Miyani'],
      },
      {
        name: 'Ranavav',
        villages: ['Ranavav', 'Rana Kandorna', 'Bileshwar', 'Ashiyapat', 'Khirasra'],
      },
      {
        name: 'Kutiyana',
        villages: ['Kutiyana', 'Paswaliya', 'Mahiyari', 'Gokran', 'Kotda'],
      },
    ],
  },
  {
    name: 'Devbhoomi Dwarka',
    talukas: [
      {
        name: 'Khambhalia',
        villages: ['Khambhalia', 'Salaya', 'Vadinar', 'Bhatia', 'Kanjur', 'Harshad'],
      },
      {
        name: 'Dwarka',
        villages: ['Dwarka', 'Okha', 'Beyt Dwarka', 'Mithapur', 'Arambhada', 'Varvala'],
      },
      {
        name: 'Kalyanpur',
        villages: ['Kalyanpur', 'Raval', 'Nandana', 'Bhogat', 'Lamba', 'Gandhvi'],
      },
      {
        name: 'Bhanvad',
        villages: ['Bhanvad', 'Jampar', 'Verad', 'Rupamora', 'Ghumli', 'Morzar'],
      },
    ],
  },
  {
    name: 'Kheda',
    talukas: [
      {
        name: 'Nadiad',
        villages: ['Nadiad', 'Uttarsanda', 'Vaso', 'Piplag', 'Gutal', 'Salun', 'Dabhan'],
      },
      {
        name: 'Kapadvanj',
        villages: ['Kapadvanj', 'Antisar', 'Torna', 'Ladvel', 'Alva', 'Dhamatvan'],
      },
      {
        name: 'Mahudha',
        villages: ['Mahudha', 'Alina', 'Kathlal', 'Lasundra', 'Chhapan'],
      },
      {
        name: 'Matar',
        villages: ['Matar', 'Limbasi', 'Traj', 'Shetranj', 'Asodar'],
      },
      {
        name: 'Mehmedabad',
        villages: ['Mehmedabad', 'Raska', 'Sinhuj', 'Kheda', 'Ghodasar'],
      },
      {
        name: 'Thasra',
        villages: ['Thasra', 'Sevaliya', 'Dakor', 'Menpura', 'Rakhial'],
      },
      {
        name: 'Galteshwar',
        villages: ['Galteshwar', 'Pali', 'Timba', 'Rustampura', 'Rozva'],
      },
      {
        name: 'Kathlal',
        villages: ['Kathlal', 'Porda', 'Abvel', 'Chhipial', 'Ghanghli'],
      },
      {
        name: 'Vaso',
        villages: ['Vaso', 'Pij', 'Gangapur', 'Rampura', 'Malataj'],
      },
    ],
  },
  {
    name: 'Panchmahal',
    talukas: [
      {
        name: 'Godhra',
        villages: ['Godhra', 'Vavdi', 'Tuwa', 'Nadisar', 'Chavaj', 'Bhamaiya'],
      },
      {
        name: 'Halol',
        villages: ['Halol', 'Pavagadh', 'Baska', 'Chandrapura', 'Tajpura', 'Abheta'],
      },
      {
        name: 'Kalol',
        villages: ['Kalol', 'Derol', 'Vejalpur', 'Boru', 'Delol'],
      },
      {
        name: 'Shehra',
        villages: ['Shehra', 'Morva Hadaf', 'Matariya', 'Bhamaiya', 'Aniyad'],
      },
      {
        name: 'Ghoghamba',
        villages: ['Ghoghamba', 'Rajgadh', 'Kantu', 'Gamani', 'Vav'],
      },
      {
        name: 'Jambughoda',
        villages: ['Jambughoda', 'Narukot', 'Jotvad', 'Dandiyapura'],
      },
      {
        name: 'Morva Hadaf',
        villages: ['Morva Hadaf', 'Suliyat', 'Khadki', 'Dangariya'],
      },
    ],
  },
  {
    name: 'Dahod',
    talukas: [
      {
        name: 'Dahod',
        villages: ['Dahod', 'Zalod', 'Garbada', 'Limkheda', 'Fatepura', 'Rachharda', 'Bordi Khurd'],
      },
      {
        name: 'Zalod',
        villages: ['Zalod', 'Muvaliya', 'Mirakheri', 'Sukhsar', 'Lilva Deva'],
      },
      {
        name: 'Devgadh Baria',
        villages: ['Devgadh Baria', 'Dhanpur', 'Singvad', 'Pipero', 'Sagtala'],
      },
      {
        name: 'Limkheda',
        villages: ['Limkheda', 'Jhalod', 'Singvad', 'Dasa', 'Agara'],
      },
      {
        name: 'Garbada',
        villages: ['Garbada', 'Gangardi', 'Jesawada', 'Bhey', 'Patiya'],
      },
      {
        name: 'Fatepura',
        villages: ['Fatepura', 'Sukhsar', 'Ghughas', 'Bhatwada'],
      },
      {
        name: 'Dhanpur',
        villages: ['Dhanpur', 'Kanjeta', 'Pav', 'Gadh', 'Pipodara'],
      },
      {
        name: 'Sanjeli',
        villages: ['Sanjeli', 'Mandli', 'Pichhoda', 'Nenki'],
      },
      {
        name: 'Singvad',
        villages: ['Singvad', 'Dabhva', 'Kaliyavad', 'Chhasiya'],
      },
    ],
  },
  {
    name: 'Aravalli',
    talukas: [
      {
        name: 'Modasa',
        villages: ['Modasa', 'Tintoi', 'Medhasan', 'Dhansura', 'Sayara', 'Malpur Road'],
      },
      {
        name: 'Bayad',
        villages: ['Bayad', 'Demai', 'Sathamba', 'Choila', 'Borroli'],
      },
      {
        name: 'Malpur',
        villages: ['Malpur', 'Helodar', 'Mewda', 'Ubharan', 'Vanka'],
      },
      {
        name: 'Bhiloda',
        villages: ['Bhiloda', 'Shamlaji', 'Lusadiya', 'Munshi', 'Kundol'],
      },
      {
        name: 'Meghraj',
        villages: ['Meghraj', 'Isari', 'Bhemla', 'Kumbhera', 'Vanta'],
      },
      {
        name: 'Dhansura',
        villages: ['Dhansura', 'Bhuthiya', 'Shinavad', 'Ramos', 'Akrud'],
      },
    ],
  },
  {
    name: 'Valsad',
    talukas: [
      {
        name: 'Valsad',
        villages: ['Valsad', 'Tithal', 'Atul', 'Dharampur', 'Pardi', 'Segvi', 'Kaprada Road'],
      },
      {
        name: 'Pardi',
        villages: ['Pardi', 'Vapi', 'Killa Pardi', 'Udvada', 'Dumlav'],
      },
      {
        name: 'Umbergaon',
        villages: ['Umbergaon', 'Sanjan', 'Bhilad', 'Sarigam', 'Maroli', 'Zaroli'],
      },
      {
        name: 'Dharampur',
        villages: ['Dharampur', 'Barumal', 'Bilpudi', 'Motapondha', 'Karchond'],
      },
      {
        name: 'Kaprada',
        villages: ['Kaprada', 'Mandva', 'Nana Pondha', 'Sutharpada', 'Dixal'],
      },
      {
        name: 'Vapi',
        villages: ['Vapi', 'Chanod', 'Chala', 'Morai', 'Salvav'],
      },
    ],
  },
];

/**
 * Get all available Gujarat district names.
 */
export function getGujaratDistricts(): string[] {
  return GUJARAT_LOCATIONS.map((d) => d.name);
}

/**
 * Get all taluka names for a selected district.
 */
export function getTalukasByDistrict(districtName: string): string[] {
  if (!districtName) return [];
  const found = GUJARAT_LOCATIONS.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase(),
  );
  return found ? found.talukas.map((t) => t.name) : [];
}

/**
 * Get all village names for a selected district and taluka.
 */
export function getVillagesByTaluka(districtName: string, talukaName: string): string[] {
  if (!districtName || !talukaName) return [];
  const district = GUJARAT_LOCATIONS.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase(),
  );
  if (!district) return [];
  const taluka = district.talukas.find(
    (t) => t.name.toLowerCase() === talukaName.trim().toLowerCase(),
  );
  return taluka ? taluka.villages : [];
}

/**
 * Validate whether a combination of district, taluka, and village is valid.
 */
export function isValidGujaratLocation(
  districtName: string,
  talukaName: string,
  villageName: string,
): boolean {
  if (!districtName || !talukaName || !villageName) return false;
  const villages = getVillagesByTaluka(districtName, talukaName);
  return villages.some((v) => v.toLowerCase() === villageName.trim().toLowerCase());
}
