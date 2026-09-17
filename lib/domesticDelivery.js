/**
 * DOMESTIC DELIVERY RATES (Lagos-onward leg)
 * --------------------------------------------
 * Every value starts null on purpose. The public calculator (lib/freight.js)
 * shows "rate to be confirmed" for any destination without a real number
 * here — never a guessed price. Fill in real ₦/kg figures (or flat rates,
 * your call) as they're confirmed; the calculator picks them up
 * automatically, no other file needs to change.
 */
export const DOMESTIC_DELIVERY_RATES = {
  'Abia': null, 'Adamawa': null, 'Akwa Ibom': null, 'Anambra': null, 'Bauchi': null,
  'Bayelsa': null, 'Benue': null, 'Borno': null, 'Cross River': null, 'Delta': null,
  'Ebonyi': null, 'Edo': null, 'Ekiti': null, 'Enugu': null, 'FCT (Abuja)': null,
  'Gombe': null, 'Imo': null, 'Jigawa': null, 'Kaduna': null, 'Kano': null,
  'Katsina': null, 'Kebbi': null, 'Kogi': null, 'Kwara': null, 'Lagos': null,
  'Nasarawa': null, 'Niger': null, 'Ogun': null, 'Ondo': null, 'Osun': null,
  'Oyo': null, 'Plateau': null, 'Rivers': null, 'Sokoto': null, 'Taraba': null,
  'Yobe': null, 'Zamfara': null,
};

export function getDomesticRate(state) {
  return DOMESTIC_DELIVERY_RATES[state] ?? null;
}

export function getConfiguredStates() {
  return Object.keys(DOMESTIC_DELIVERY_RATES);
}
