import { Images } from '../constants/Images';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  specializationKey: string;
  experience: number;
  rating: number;
  patientsServed: number;
  photo: string;
  verified: boolean;
  education: string[];
  specialTraining: string[];
  hospitalAffiliation: string;
  languagesSpoken: string[];
  about: string;
  consultationFee: number;
  availableSlots: TimeSlot[];
  profileStrength: {
    photo: boolean;
    education: boolean;
    specialization: boolean;
    experience: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  diseases: string[]; // diseases this doctor treats
  isFamous?: boolean;
}

export interface TimeSlot {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  image: string;
  distance: string;
  rating: number;
  doctorsCount: number;
  specialities: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Category {
  id: string;
  nameKey: string;
  icon: string;
  color: string;
  gradient: [string, string];
}

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  photo: string;
  date: string;
  time: string;
  tokenNumber: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  hospitalName: string;
}

// Disease-to-specialization mapping for search
export const diseaseMapping: Record<string, string[]> = {
  // General Physician diseases
  fever: ['generalPhysician', 'pediatrician'],
  cold: ['generalPhysician', 'pediatrician'],
  cough: ['generalPhysician', 'pediatrician'],
  flu: ['generalPhysician'],
  headache: ['generalPhysician', 'neuroSpecialist'],
  'body pain': ['generalPhysician', 'orthopedic'],
  diabetes: ['generalPhysician'],
  'blood pressure': ['generalPhysician', 'heartSpecialist'],
  thyroid: ['generalPhysician'],
  infection: ['generalPhysician'],
  allergy: ['generalPhysician', 'skinSpecialist'],
  weakness: ['generalPhysician'],
  vomiting: ['generalPhysician', 'pediatrician'],
  diarrhea: ['generalPhysician', 'pediatrician'],

  // Pediatrician diseases
  'child fever': ['pediatrician'],
  vaccination: ['pediatrician'],
  'baby care': ['pediatrician'],
  'child nutrition': ['pediatrician'],
  'growth problems': ['pediatrician'],

  // Orthopedic diseases
  'knee pain': ['orthopedic'],
  'back pain': ['orthopedic', 'generalPhysician'],
  fracture: ['orthopedic'],
  'joint pain': ['orthopedic', 'generalPhysician'],
  arthritis: ['orthopedic'],
  'sports injury': ['orthopedic'],
  'neck pain': ['orthopedic', 'neuroSpecialist'],
  'shoulder pain': ['orthopedic'],

  // Dentist diseases
  'tooth pain': ['dentist'],
  'tooth decay': ['dentist'],
  'gum problem': ['dentist'],
  'teeth cleaning': ['dentist'],
  'root canal': ['dentist'],
  braces: ['dentist'],

  // Eye diseases
  'eye pain': ['eyeSpecialist'],
  'blurred vision': ['eyeSpecialist'],
  cataract: ['eyeSpecialist'],
  'dry eyes': ['eyeSpecialist'],
  glasses: ['eyeSpecialist'],
  'red eyes': ['eyeSpecialist'],

  // Skin diseases
  acne: ['skinSpecialist'],
  pimples: ['skinSpecialist'],
  rash: ['skinSpecialist', 'generalPhysician'],
  'hair fall': ['skinSpecialist'],
  dandruff: ['skinSpecialist'],
  eczema: ['skinSpecialist'],
  'skin allergy': ['skinSpecialist'],
  fungal: ['skinSpecialist'],
  ringworm: ['skinSpecialist'],

  // Heart diseases
  'chest pain': ['heartSpecialist', 'generalPhysician'],
  'heart attack': ['heartSpecialist'],
  'breathing problem': ['heartSpecialist', 'generalPhysician'],
  'high cholesterol': ['heartSpecialist'],
  palpitations: ['heartSpecialist'],

  // Neuro diseases
  migraine: ['neuroSpecialist', 'generalPhysician'],
  'memory loss': ['neuroSpecialist'],
  'nerve pain': ['neuroSpecialist'],
  seizure: ['neuroSpecialist'],
  dizziness: ['neuroSpecialist', 'generalPhysician'],
  paralysis: ['neuroSpecialist'],

  // Gynecologist diseases
  pregnancy: ['gynecologist'],
  periods: ['gynecologist'],
  pcod: ['gynecologist'],
  'menstrual pain': ['gynecologist'],
  infertility: ['gynecologist'],
  'women health': ['gynecologist'],
  delivery: ['gynecologist'],
  'c-section': ['gynecologist'],

  // Dermatologist diseases
  skin: ['dermatologist', 'skinSpecialist'],
};

export const categories: Category[] = [
  { id: '1', nameKey: 'generalPhysician', icon: '🩺', color: '#E6F7F9', gradient: ['#E6F7F9', '#CCF0F4'] },
  { id: '2', nameKey: 'pediatrician', icon: '👶', color: '#E8F8EE', gradient: ['#E8F8EE', '#D0F0DC'] },
  { id: '3', nameKey: 'orthopedic', icon: '🦴', color: '#FFF8E7', gradient: ['#FFF8E7', '#FFF0CE'] },
  { id: '4', nameKey: 'dentist', icon: '🦷', color: '#FFF0F0', gradient: ['#FFF0F0', '#FFE0E0'] },
  { id: '5', nameKey: 'eyeSpecialist', icon: '👁️', color: '#F3EEFE', gradient: ['#F3EEFE', '#E6DDFD'] },
  { id: '6', nameKey: 'skinSpecialist', icon: '🧴', color: '#E6F7F9', gradient: ['#E6FBFF', '#CCF0F8'] },
  { id: '7', nameKey: 'heartSpecialist', icon: '❤️', color: '#FFF0F0', gradient: ['#FFF0F0', '#FFD9D9'] },
  { id: '8', nameKey: 'neuroSpecialist', icon: '🧠', color: '#FFF3E6', gradient: ['#FFF3E6', '#FFE5CC'] },
];

const generateSlots = (): TimeSlot[] => [
  { id: 's1', time: '9:00 AM', period: 'morning', available: true },
  { id: 's2', time: '9:30 AM', period: 'morning', available: true },
  { id: 's3', time: '10:00 AM', period: 'morning', available: false },
  { id: 's4', time: '10:30 AM', period: 'morning', available: true },
  { id: 's5', time: '11:00 AM', period: 'morning', available: true },
  { id: 's6', time: '11:30 AM', period: 'morning', available: false },
  { id: 's7', time: '2:00 PM', period: 'afternoon', available: true },
  { id: 's8', time: '2:30 PM', period: 'afternoon', available: true },
  { id: 's9', time: '3:00 PM', period: 'afternoon', available: true },
  { id: 's10', time: '3:30 PM', period: 'afternoon', available: false },
  { id: 's11', time: '5:00 PM', period: 'evening', available: true },
  { id: 's12', time: '5:30 PM', period: 'evening', available: true },
  { id: 's13', time: '6:00 PM', period: 'evening', available: true },
  { id: 's14', time: '6:30 PM', period: 'evening', available: false },
];

export const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sumedh Maisalge',
    specialization: 'Dermatologist',
    specializationKey: 'dermatologist',
    experience: 15,
    rating: 4.8,
    patientsServed: 5200,
    photo: Images.doctor1,
    verified: true,
    education: ['MBBS - AIIMS Delhi', 'MD - Internal Medicine'],
    specialTraining: ['Laser Treatment', 'Preventive Healthcare'],
    hospitalAffiliation: 'City General Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Trusted family doctor with 15 years of caring for patients. Specializes in diabetes, blood pressure, and general health checkups.',
    consultationFee: 300,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3647, longitude: 75.1240, address: 'MG Road, Hubli' },
    diseases: ['skin','fever', 'cold', 'cough', 'diabetes', 'blood pressure', 'thyroid', 'infection', 'allergy', 'weakness', 'flu', 'headache', 'body pain', 'vomiting', 'diarrhea'],
    isFamous: true,
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    specialization: 'Pediatrician',
    specializationKey: 'pediatrician',
    experience: 10,
    rating: 4.9,
    patientsServed: 3800,
    photo: Images.doctor2,
    verified: true,
    education: ['MBBS - KMC Manipal', 'MD - Pediatrics'],
    specialTraining: ['Neonatal Care', 'Child Nutrition'],
    hospitalAffiliation: 'Mother & Child Hospital',
    languagesSpoken: ['English', 'Hindi'],
    about: 'Gentle and caring pediatrician loved by kids and parents alike. Expert in child growth, vaccination, and newborn care.',
    consultationFee: 400,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3700, longitude: 75.1300, address: 'Vidyanagar, Hubli' },
    diseases: ['child fever', 'vaccination', 'baby care', 'child nutrition', 'growth problems', 'fever', 'cold', 'cough', 'vomiting', 'diarrhea'],
    isFamous: true,
  },
  {
    id: '3',
    name: 'Dr. Suresh Patil',
    specialization: 'Orthopedic',
    specializationKey: 'orthopedic',
    experience: 20,
    rating: 4.7,
    patientsServed: 7100,
    photo: Images.doctor3,
    verified: true,
    education: ['MBBS - JNMC Belgaum', 'MS - Orthopedics', 'Fellowship - Joint Replacement'],
    specialTraining: ['Knee Replacement', 'Sports Injuries'],
    hospitalAffiliation: 'Ortho Care Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'One of the top joint replacement surgeons in North Karnataka. Known for pain-free knee and hip surgeries.',
    consultationFee: 500,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3580, longitude: 75.1180, address: 'Keshwapur, Hubli' },
    diseases: ['knee pain', 'back pain', 'fracture', 'joint pain', 'arthritis', 'sports injury', 'neck pain', 'shoulder pain', 'body pain'],
    isFamous: true,
  },
  {
    id: '4',
    name: 'Dr. Meena Devi',
    specialization: 'Dentist',
    specializationKey: 'dentist',
    experience: 8,
    rating: 4.6,
    patientsServed: 2500,
    photo: Images.doctor4,
    verified: true,
    education: ['BDS - SDM Dharwad', 'MDS - Orthodontics'],
    specialTraining: ['Dental Implants', 'Cosmetic Dentistry'],
    hospitalAffiliation: 'Smile Dental Clinic',
    languagesSpoken: ['English', 'Kannada'],
    about: 'Modern pain-free dental treatments. Expert in teeth whitening, root canal, and dental implants.',
    consultationFee: 250,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: false },
    location: { latitude: 15.3620, longitude: 75.1260, address: 'Deshpande Nagar, Hubli' },
    diseases: ['tooth pain', 'tooth decay', 'gum problem', 'teeth cleaning', 'root canal', 'braces'],
  },
  {
    id: '5',
    name: 'Dr. Anil Hegde',
    specialization: 'Eye Specialist',
    specializationKey: 'eyeSpecialist',
    experience: 12,
    rating: 4.8,
    patientsServed: 4200,
    photo: Images.doctor5,
    verified: true,
    education: ['MBBS - KIMS Hubli', 'MS - Ophthalmology'],
    specialTraining: ['Cataract Surgery', 'LASIK'],
    hospitalAffiliation: 'Vision Eye Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Experienced eye doctor known for painless cataract surgeries. Over 4,000 successful eye operations.',
    consultationFee: 350,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3660, longitude: 75.1220, address: 'Gokul Road, Hubli' },
    diseases: ['eye pain', 'blurred vision', 'cataract', 'dry eyes', 'glasses', 'red eyes'],
    isFamous: true,
  },
  {
    id: '6',
    name: 'Dr. Kavitha Rao',
    specialization: 'Heart Specialist',
    specializationKey: 'heartSpecialist',
    experience: 18,
    rating: 4.9,
    patientsServed: 6000,
    photo: Images.doctor6,
    verified: true,
    education: ['MBBS - BMC Bangalore', 'MD - Cardiology', 'DM - Interventional Cardiology'],
    specialTraining: ['Angioplasty', 'Heart Failure Management'],
    hospitalAffiliation: 'Heart Care Centre',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Leading cardiologist with 18 years experience. Expert in heart disease prevention and emergency cardiac care.',
    consultationFee: 600,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3710, longitude: 75.1350, address: 'Navanagar, Hubli' },
    diseases: ['chest pain', 'heart attack', 'breathing problem', 'high cholesterol', 'palpitations', 'blood pressure'],
    isFamous: true,
  },
  {
    id: '7',
    name: 'Dr. Vinod Kulkarni',
    specialization: 'Skin Specialist',
    specializationKey: 'skinSpecialist',
    experience: 11,
    rating: 4.7,
    patientsServed: 3600,
    photo: Images.doctor7,
    verified: true,
    education: ['MBBS - KIMS Hubli', 'MD - Dermatology'],
    specialTraining: ['Laser Therapy', 'Hair Transplant'],
    hospitalAffiliation: 'Glow Skin Clinic',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Trusted dermatologist for all skin, hair, and nail problems. Uses the latest laser and cosmetic treatments.',
    consultationFee: 400,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3640, longitude: 75.1280, address: 'Lamington Road, Hubli' },
    diseases: ['acne', 'pimples', 'rash', 'hair fall', 'dandruff', 'eczema', 'skin allergy', 'fungal', 'ringworm'],
  },
  {
    id: '8',
    name: 'Dr. Lakshmi Iyer',
    specialization: 'Brain & Nerve Specialist',
    specializationKey: 'neuroSpecialist',
    experience: 14,
    rating: 4.8,
    patientsServed: 2900,
    photo: Images.doctor8,
    verified: true,
    education: ['MBBS - NIMHANS Bangalore', 'DM - Neurology'],
    specialTraining: ['Stroke Management', 'Epilepsy Treatment'],
    hospitalAffiliation: 'Neuro Care Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Expert neurologist specializing in migraines, seizures, and nerve disorders. Gentle and thorough approach.',
    consultationFee: 550,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3690, longitude: 75.1190, address: 'Old Hubli Road' },
    diseases: ['migraine', 'headache', 'memory loss', 'nerve pain', 'seizure', 'dizziness', 'paralysis', 'neck pain'],
  },
  {
    id: '9',
    name: 'Dr. Ramesh Joshi',
    specialization: 'General Physician',
    specializationKey: 'generalPhysician',
    experience: 22,
    rating: 4.6,
    patientsServed: 8500,
    photo: Images.doctor9,
    verified: true,
    education: ['MBBS - KLE Belgaum', 'MD - General Medicine'],
    specialTraining: ['Critical Care', 'Infectious Disease'],
    hospitalAffiliation: 'City General Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Senior physician with over two decades of experience. Known for accurate diagnosis and compassionate care.',
    consultationFee: 350,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3655, longitude: 75.1260, address: 'Station Road, Hubli' },
    diseases: ['fever', 'cold', 'cough', 'diabetes', 'blood pressure', 'infection', 'allergy', 'weakness', 'flu', 'headache', 'vomiting', 'diarrhea'],
    isFamous: true,
  },
  {
    id: '10',
    name: 'Dr. Anjali Desai',
    specialization: 'Pediatrician',
    specializationKey: 'pediatrician',
    experience: 9,
    rating: 4.8,
    patientsServed: 3200,
    photo: Images.doctor10,
    verified: true,
    education: ['MBBS - SDM Dharwad', 'MD - Pediatrics'],
    specialTraining: ['Adolescent Health', 'Allergy in Children'],
    hospitalAffiliation: 'Mother & Child Hospital',
    languagesSpoken: ['English', 'Kannada'],
    about: 'Loving pediatrician focused on holistic child development. Expert in managing allergies and childhood infections.',
    consultationFee: 350,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3715, longitude: 75.1320, address: 'Shirur Park, Hubli' },
    diseases: ['child fever', 'vaccination', 'baby care', 'child nutrition', 'growth problems', 'fever', 'cold', 'allergy'],
  },
  {
    id: '11',
    name: 'Dr. Priya',
    specialization: 'Gynecologist',
    specializationKey: 'gynecologist',
    experience: 13,
    rating: 4.9,
    patientsServed: 4500,
    photo: Images.doctor11,
    verified: true,
    education: ['MBBS - KIMS Hubli', 'MS - Obstetrics & Gynecology'],
    specialTraining: ['High-Risk Pregnancy', 'Laparoscopic Surgery'],
    hospitalAffiliation: 'Manthale Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Compassionate gynecologist specializing in women\'s health, pregnancy care, and minimally invasive surgeries. Trusted by thousands of families.',
    consultationFee: 450,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3680, longitude: 75.1310, address: 'Manthale Hospital, Hubli' },
    diseases: ['pregnancy', 'periods', 'pcod', 'menstrual pain', 'infertility', 'women health', 'delivery', 'c-section'],
    isFamous: true,
  },
  {
    id: '12',
    name: 'Dr. Pruthvi Biradar',
    specialization: 'Heart Specialist',
    specializationKey: 'heartSpecialist',
    experience: 16,
    rating: 4.8,
    patientsServed: 5800,
    photo: Images.doctor12,
    verified: true,
    education: ['MBBS - JNMC Belgaum', 'MD - Cardiology', 'DM - Cardiology'],
    specialTraining: ['Interventional Cardiology', 'Cardiac Rehabilitation'],
    hospitalAffiliation: 'Biradar Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Expert cardiologist with 16 years of experience in treating complex heart conditions. Known for patient-friendly approach and accurate diagnosis.',
    consultationFee: 550,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3630, longitude: 75.1200, address: 'Biradar Hospital, Hubli' },
    diseases: ['chest pain', 'heart attack', 'breathing problem', 'high cholesterol', 'palpitations', 'blood pressure', 'heart failure'],
    isFamous: true,
  },
  {
    id: '13',
    name: 'Dr. Anand Dande',
    specialization: 'General Physician',
    specializationKey: 'generalPhysician',
    experience: 19,
    rating: 4.7,
    patientsServed: 9200,
    photo: Images.doctor13,
    verified: true,
    education: ['MBBS - BMC Bangalore', 'MD - General Medicine'],
    specialTraining: ['Diabetes Management', 'Preventive Medicine'],
    hospitalAffiliation: 'Ganga Hospital',
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    about: 'Highly experienced general physician with nearly two decades of service. Expert in managing chronic conditions like diabetes and hypertension with a personal touch.',
    consultationFee: 400,
    availableSlots: generateSlots(),
    profileStrength: { photo: true, education: true, specialization: true, experience: true },
    location: { latitude: 15.3670, longitude: 75.1250, address: 'Ganga Hospital, Hubli' },
    diseases: ['fever', 'cold', 'cough', 'diabetes', 'blood pressure', 'thyroid', 'infection', 'allergy', 'weakness', 'flu', 'headache', 'body pain', 'vomiting', 'diarrhea'],
    isFamous: true,
  },
];

export const hospitals: Hospital[] = [
  {
    id: '1',
    name: 'City General Hospital',
    image: Images.hospital1,
    distance: '1.2 km',
    rating: 4.5,
    doctorsCount: 25,
    specialities: ['General', 'Cardiology', 'Orthopedics'],
    location: { latitude: 15.3647, longitude: 75.1240, address: 'MG Road, Hubli' },
  },
  {
    id: '2',
    name: 'Mother & Child Hospital',
    image: Images.hospital2,
    distance: '2.5 km',
    rating: 4.7,
    doctorsCount: 15,
    specialities: ['Pediatrics', 'Gynecology', 'Neonatal'],
    location: { latitude: 15.3700, longitude: 75.1300, address: 'Vidyanagar, Hubli' },
  },
  {
    id: '3',
    name: 'Ortho Care Hospital',
    image: Images.hospital3,
    distance: '3.1 km',
    rating: 4.6,
    doctorsCount: 12,
    specialities: ['Orthopedics', 'Physiotherapy', 'Sports Medicine'],
    location: { latitude: 15.3580, longitude: 75.1180, address: 'Keshwapur, Hubli' },
  },
  {
    id: '4',
    name: 'Manthale Hospital',
    image: Images.hospital4,
    distance: '1.8 km',
    rating: 4.8,
    doctorsCount: 18,
    specialities: ['Gynecology', 'Obstetrics', 'Pediatrics'],
    location: { latitude: 15.3680, longitude: 75.1310, address: 'Manthale Hospital, Hubli' },
  },
  {
    id: '5',
    name: 'Biradar Hospital',
    image: Images.hospital5,
    distance: '2.2 km',
    rating: 4.7,
    doctorsCount: 20,
    specialities: ['Cardiology', 'General Medicine', 'Critical Care'],
    location: { latitude: 15.3630, longitude: 75.1200, address: 'Biradar Hospital, Hubli' },
  },
  {
    id: '6',
    name: 'Ganga Hospital',
    image: Images.hospital6,
    distance: '1.5 km',
    rating: 4.6,
    doctorsCount: 22,
    specialities: ['General Medicine', 'Diabetes Care', 'Preventive Health'],
    location: { latitude: 15.3670, longitude: 75.1250, address: 'Ganga Hospital, Hubli' },
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    doctorId: '1',
    doctorName: 'Dr. Rajesh Kumar',
    specialization: 'General Physician',
    photo: Images.doctor1,
    date: 'Today',
    time: '10:00 AM',
    tokenNumber: 7,
    status: 'confirmed',
    hospitalName: 'City General Hospital',
  },
  {
    id: 'b2',
    doctorId: '2',
    doctorName: 'Dr. Priya Sharma',
    specialization: 'Pediatrician',
    photo: Images.doctor2,
    date: 'Tomorrow',
    time: '2:30 PM',
    tokenNumber: 3,
    status: 'confirmed',
    hospitalName: 'Mother & Child Hospital',
  },
];

export const getDoctorById = (id: string): Doctor | undefined => {
  console.log(`[DEBUG] Fetching doctor by ID: ${id}`);
  const doctor = doctors.find((d) => d.id === id);
  console.log(`[DEBUG] Doctor found:`, doctor);
  return doctor;
};

export const getDoctorsByCategory = (categoryKey: string): Doctor[] => {
  console.log(`[DEBUG] Fetching doctors by category: ${categoryKey}`);
  const filteredDoctors = doctors.filter((d) => d.specializationKey === categoryKey);
  console.log(`[DEBUG] Doctors found:`, filteredDoctors);
  return filteredDoctors;
};

export const searchDoctorsByDisease = (query: string): Doctor[] => {
  const q = query.toLowerCase().trim();
  console.log(`[DEBUG] Searching doctors by disease with query: "${q}"`);
  if (!q) return [];

  const matchedSpecializations = new Set<string>();
  for (const [disease, specs] of Object.entries(diseaseMapping)) {
    if (disease.includes(q) || q.includes(disease)) {
      specs.forEach((s) => matchedSpecializations.add(s));
    }
  }

  const fromDiseases = doctors.filter((d) =>
    matchedSpecializations.has(d.specializationKey) ||
    d.diseases.some((dis) => dis.includes(q))
  );

  const fromText = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.hospitalAffiliation.toLowerCase().includes(q)
  );

  const seen = new Set<string>();
  const results: Doctor[] = [];
  [...fromDiseases, ...fromText].forEach((d) => {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      results.push(d);
    }
  });

  console.log(`[DEBUG] Search results:`, results);
  return results;
};
