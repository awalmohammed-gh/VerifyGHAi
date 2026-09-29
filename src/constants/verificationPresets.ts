export interface VerificationPreset {
  title: string;
  type: 'TEXT' | 'ARTICLE_URL' | 'SCREENSHOT';
  content: string;
  url?: string;
  imageName?: string;
  expectedClassification: 'VERIFIED' | 'TRUSTED' | 'SUSPICIOUS' | 'FAKE';
  description?: string;
}

export const verificationPresets: VerificationPreset[] = [
  {
    title: 'Fabricated Medical Remedy (Health Hoax)',
    type: 'TEXT',
    content:
      'URGENT: Drinking boiled guava leaves and garlic three times a day will permanently reverse chronic hypertension in 48 hours without doctor prescribed pills. Pharmaceutical companies are hiding this ancient secret from ordinary citizens to sell expensive imported drugs! Share this message with every family member immediately before it gets deleted!',
    expectedClassification: 'FAKE',
    description: 'Unverified medical claim with conspiratorial phrasing and urgency cues.',
  },
  {
    title: 'Official Ghana Bank Monetary Policy Rate Report',
    type: 'ARTICLE_URL',
    content:
      'The Monetary Policy Committee of the Bank of Ghana has maintained the benchmark policy rate at 29.0%, citing easing inflationary pressures, enhanced currency stability, and strong reserve accumulation under the IMF Extended Credit Facility programme.',
    url: 'https://bog.gov.gh/monetary-policy/press-release-august-2026',
    expectedClassification: 'VERIFIED',
    description: 'Statutory press release from official central banking portal.',
  },
  {
    title: 'Fabricated Electoral Commission Recount Directive',
    type: 'SCREENSHOT',
    imageName: 'electoral-commission-memo.png',
    content:
      'CONFIDENTIAL DIRECTIVE: The Electoral Commission has officially ordered an emergency biometric manual recount across all 275 constituencies due to catastrophic central server synchronization failures during transmission testing.',
    expectedClassification: 'FAKE',
    description: 'Forged institutional memo with fabricated letterhead and panic narrative.',
  },
  {
    title: 'Government Infrastructure Highway Commissioning',
    type: 'TEXT',
    content:
      'The Ministry of Roads and Highways has commissioned the newly modernized 4-lane Pokuase-Nsawam dual carriageway ahead of schedule, funded through the bilateral African Development Bank partnership to relieve commuter congestion on the Accra-Kumasi international transit corridor.',
    expectedClassification: 'VERIFIED',
    description: 'Government infrastructure development announcement confirmed by statutory agencies.',
  },
];

export const demoVerificationPresets = verificationPresets;
