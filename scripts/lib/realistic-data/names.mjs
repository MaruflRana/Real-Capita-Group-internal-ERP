import { SeededRandom } from './shared.mjs';

// ── Muslim name pools (~70%) ────────────────────────────────────────

export const MUSLIM_MALE_FIRST = [
  'Rafiq', 'Kamal', 'Abdullah', 'Shahidul', 'Imran', 'Sajedul', 'Farhan',
  'Nazmus', 'Ashraf', 'Tariq', 'Jamil', 'Omar', 'Md.', 'Rubel', 'Shafiq',
  'Amin', 'Mahbub', 'Nasir', 'Saiful', 'Ruhul', 'Aminul', 'Fazlul',
  'Khalil', 'Iqbal', 'Mujib', 'Zahid', 'Mashruf', 'Habib', 'Salauddin',
  'Alamgir', 'Mosharraf', 'Zillur', 'Nurul', 'Abul', 'Quddus', 'Mohiuddin',
  'Shamsuddin', 'Giasuddin', 'Muktadir', 'Ataur', 'Ahsan', 'Hamidul',
  'Mizanur', 'Mafiz', 'Badal', 'Monir', 'Rezaul', 'Jahangir', 'Momin',
  'Hafiz', 'Enamul', 'Liton', 'Sohel', 'Milon', 'Rasel', 'Kawsar',
  'Shohag', 'Sumon', 'Ripon', 'Masud', 'Mahmudul', 'Arif', 'Sabbir',
  'Ebrahim', 'Mursalin', 'Amir', 'Nayeem', 'Shakil', 'Tanvir', 'Faisal',
];

export const MUSLIM_MALE_LAST = [
  'Hossain', 'Uddin', 'Al Mamun', 'Islam', 'Karim', 'Chowdhury', 'Saquib',
  'Ali', 'Bin Yousuf', 'Rahman', 'Khan', 'Molla', 'Bhuiyan', 'Sarkar',
  'Mondal', 'Patwari', 'Howlader', 'Talukder', 'Sheikh', 'Mia', 'Das',
  'Barbhuiya', 'Sardar', 'Siddique', 'Mahbub', 'Quraishi', 'Raza',
];

export const MUSLIM_FEMALE_FIRST = [
  'Nadia', 'Fatema', 'Samira', 'Ishrat', 'Amina', 'Taslima', 'Farhana',
  'Mahbuba', 'Nasreen', 'Rabeya', 'Shahana', 'Halima', 'Jahanara', 'Rokeya',
  'Selina', 'Kamrunnahar', 'Bilkis', 'Momena', 'Ayesha', 'Ferdousi',
  'Roksana', 'Parvin', 'Sufia', 'Anwara', 'Kohinoor', 'Shahanaz', 'Afia',
  'Jasmin', 'Mithila', 'Tanjim', 'Nusrat', 'Reshma', 'Rima', 'Shila',
  'Morium', 'Afrose', 'Sabina', 'Umma', 'Khaleda', 'Mousumi', 'Tapu',
  'Sumaiya', 'Asma', 'Noor', 'Nahar', 'Maksuda', 'Jahan', 'Begum',
];

export const MUSLIM_FEMALE_LAST = [
  'Akter', 'Begum', 'Khatun', 'Rahman', 'Chowdhury', 'Nesa', 'Sultana',
  'Parvin', 'Nobi', 'Jahan', 'Hoque', 'Islam', 'Hossain', 'Khan', 'Molla',
];

// ── Hindu name pools (~20%) ──────────────────────────────────────────

export const HINDU_MALE_FIRST = [
  'Suresh', 'Rajesh', 'Debashish', 'Arun', 'Pranab', 'Bikash', 'Sujit',
  'Anil', 'Dilip', 'Tarun', 'Kartik', 'Subrata', 'Gopal', 'Harish',
  'Manish', 'Nikhil', 'Rana', 'Bappi', 'Ashim', 'Pinaki', 'Satyajit',
  'Rabin', 'Amit', 'Sanjoy', 'Dhrubo', 'Koushik', 'Shuvo', 'Joy',
  'Mithun', 'Biman',
];

export const HINDU_MALE_LAST = [
  'Chandra Das', 'Sharma', 'Bose', 'Mandal', 'Saha', 'Paul', 'Roy',
  'Ghosh', 'Mukherjee', 'Banerjee', 'Chakraborty', 'Chattopadhyay',
  'Deb', 'Dutta', 'Sen', 'Bhowmick', 'Nath', 'Poddar', 'Sarkar',
];

export const HINDU_FEMALE_FIRST = [
  'Priya', 'Gita', 'Ananya', 'Rina', 'Lakshmi', 'Soma', 'Deepa',
  'Mousumi', 'Shikha', 'Nandita', 'Pallabi', 'Rumi', 'Sraboni',
  'Tumpa', 'Rani', 'Jayashri', 'Keya', 'Aparajita', 'Manashi',
];

export const HINDU_FEMALE_LAST = [
  'Sharma', 'Das', 'Bose', 'Mandal', 'Saha', 'Roy', 'Ghosh',
  'Mukherjee', 'Banerjee', 'Sen', 'Dutta', 'Nath', 'Poddar',
];

// ── Business entity names (~10%) ──────────────────────────────────────

export const BUSINESS_ENTITY_NAMES = [
  'Khan Brothers Enterprises',
  'Chowdhury & Associates Ltd',
  'Bangladesh Premier Traders',
  'Delta Construction Ltd',
  'Skyline Properties Associates',
  'Green Valley Developers',
  'Dhaka Metropolitan Holdings',
  'Purbachal Land Investments',
  'Golden Gate Real Estate Ltd',
  'Silver Line Trading Co',
  'Riverbank Properties Group',
  'Eastern Horizon Construction',
  'Metro City Developers Ltd',
  'Southern Estates International',
  'United Land Holdings',
  'Capital Property Ventures',
  'National Housing Associates',
  'Heritage Developers Group',
  'Prime Land Traders',
  'Urban Growth Properties Ltd',
];

// ── Name generation ──────────────────────────────────────────────────

export const generatePersonName = (rng, gender = 'male') => {
  const isMuslim = rng.chance(0.7);
  const isHindu = !isMuslim ? false : rng.chance(0.85);

  if (isMuslim) {
    if (gender === 'male') {
      const first = rng.pick(MUSLIM_MALE_FIRST);
      const last = rng.pick(MUSLIM_MALE_LAST);
      return { fullName: `${first} ${last}`, first, last };
    }

    const first = rng.pick(MUSLIM_FEMALE_FIRST);
    const last = rng.pick(MUSLIM_FEMALE_LAST);
    return { fullName: `${first} ${last}`, first, last };
  }

  if (isHindu) {
    if (gender === 'male') {
      const first = rng.pick(HINDU_MALE_FIRST);
      const last = rng.pick(HINDU_MALE_LAST);
      return { fullName: `${first} ${last}`, first, last };
    }

    const first = rng.pick(HINDU_FEMALE_FIRST);
    const last = rng.pick(HINDU_FEMALE_LAST);
    return { fullName: `${first} ${last}`, first, last };
  }

  if (gender === 'male') {
    const first = rng.pick(MUSLIM_MALE_FIRST);
    const last = rng.pick(MUSLIM_MALE_LAST);
    return { fullName: `${first} ${last}`, first, last };
  }

  const first = rng.pick(MUSLIM_FEMALE_FIRST);
  const last = rng.pick(MUSLIM_FEMALE_LAST);
  return { fullName: `${first} ${last}`, first, last };
};

export const generateBusinessName = (rng) => {
  return rng.pick(BUSINESS_ENTITY_NAMES);
};

// ── Address generation ───────────────────────────────────────────────

const AREA_POOL = [
  { area: 'Uttara', city: 'Dhaka' },
  { area: 'Dhanmondi', city: 'Dhaka' },
  { area: 'Gulshan', city: 'Dhaka' },
  { area: 'Badda', city: 'Dhaka' },
  { area: 'Bashundhara R/A', city: 'Dhaka' },
  { area: 'Azimpur', city: 'Dhaka' },
  { area: 'Motijheel', city: 'Dhaka' },
  { area: 'Tejgaon', city: 'Dhaka' },
  { area: 'Mirpur', city: 'Dhaka' },
  { area: 'Rampura', city: 'Dhaka' },
  { area: 'Abdullahpur', city: 'Keraniganj, Dhaka' },
  { area: 'Kadomtoly', city: 'Keraniganj, Dhaka' },
  { area: 'Purbachal', city: 'Rupganj, Narayanganj' },
  { area: 'Sreenagar', city: 'Munshiganj' },
  { area: 'Savar', city: 'Dhaka' },
  { area: 'Sonadanga R/A', city: 'Khulna' },
  { area: 'Khalishpur', city: 'Khulna' },
  { area: 'Daulatpur', city: 'Khulna' },
  { area: 'Kuakata', city: 'Patuakhali' },
];

export const generateAddress = (rng, type = 'residential') => {
  const location = rng.pick(AREA_POOL);
  const houseNum = rng.nextInt(1, 200);
  const roadNum = rng.nextInt(1, 50);
  const flatNum = type === 'apartment' ? `Flat ${rng.nextInt(1, 20)}${String.fromCharCode(65 + rng.nextInt(0, 3))}` : null;

  if (type === 'apartment' || rng.chance(0.3)) {
    return `${flatNum ?? `House ${houseNum}`}, Road ${roadNum}, ${location.area}, ${location.city}`;
  }

  if (type === 'plot') {
    return `Plot ${rng.nextInt(1, 500)}, ${location.area}, ${location.city}`;
  }

  return `House ${houseNum}, Road ${roadNum}, ${location.area}, ${location.city}`;
};

// ── Phone generation ─────────────────────────────────────────────────

const MOBILE_PREFIXES = ['0017', '018', '019', '016', '015'];
const MOBILE_PREFIX_WEIGHTS = [0.30, 0.25, 0.20, 0.15, 0.10];

export const generatePhone = (rng) => {
  const prefixIndex = weightedPick(rng, MOBILE_PREFIX_WEIGHTS);
  const prefix = MOBILE_PREFIXES[prefixIndex];
  const suffix = String(rng.nextInt(10000000, 99999999)).padStart(8, '0');
  return `${prefix}${suffix}`;
};

function weightedPick(rng, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

// ── Email generation ──────────────────────────────────────────────────

const EMAIL_DOMAINS = [
  { domain: 'gmail.com', weight: 0.40 },
  { domain: 'yahoo.com', weight: 0.15 },
  { domain: 'hotmail.com', weight: 0.10 },
  { domain: 'mailbox.com.bd', weight: 0.05 },
];

const EMAIL_DOMAIN_WEIGHTS = EMAIL_DOMAINS.map((d) => d.weight);

export const generateCustomerEmail = (rng, firstName, lastName, seq) => {
  if (rng.chance(0.30)) return null;

  const domainIndex = weightedPick(rng, EMAIL_DOMAIN_WEIGHTS);
  const domain = EMAIL_DOMAINS[domainIndex].domain;
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').replace(/^md$/i, 'md');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const base = `${cleanFirst}.${cleanLast}`;
  return seq > 0 ? `${base}${seq}@${domain}` : `${base}@${domain}`;
};

export const generateEmployeeEmail = (firstName, lastName) => {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').replace(/^md$/i, 'md');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${cleanFirst}.${cleanLast}@realcapita.com.bd`;
};

// ── Phone uniqueness resolver ────────────────────────────────────────

export class UniquePhonePool {
  constructor(rng, count) {
    this.usedPhones = new Set();
    this.rng = rng;
    this.count = count;
  }

  next() {
    let attempts = 0;
    while (attempts < 1000) {
      const phone = generatePhone(this.rng);
      if (!this.usedPhones.has(phone)) {
        this.usedPhones.add(phone);
        return phone;
      }
      attempts += 1;
    }
    const prefix = this.rng.pick(['017', '018', '019', '016', '015']);
    const suffix = String(this.usedPhones.size + 10000000).slice(-8);
    const phone = `${prefix}${suffix}`;
    this.usedPhones.add(phone);
    return phone;
  }
}

// ── Email uniqueness resolver ────────────────────────────────────────

export class UniqueEmailPool {
  constructor(rng, domainWeights) {
    this.usedEmails = new Set();
    this.rng = rng;
    this.domainWeights = domainWeights || EMAIL_DOMAIN_WEIGHTS;
  }

  next(baseName) {
    let attempts = 0;
    const domainIndex = weightedPick(this.rng, this.domainWeights);
    const domain = EMAIL_DOMAINS[domainIndex].domain;

    while (attempts < 100) {
      const suffix = attempts > 0 ? attempts : '';
      const email = `${baseName}${suffix}@${domain}`;
      if (!this.usedEmails.has(email)) {
        this.usedEmails.add(email);
        return email;
      }
      attempts += 1;
    }

    return null;
  }
}
