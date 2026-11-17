/**
 * Creates the "Provo Student Housing – Buyer Preferences" Google Form.
 * Paste into a new project at script.google.com, then click Run.
 * The form's edit and share links are printed in the Execution log.
 */
function createBuyerForm() {
  var form = FormApp.create('Provo Student Housing – Buyer Preferences');
  form.setDescription(
    "Looking for a BYU/UVU housing contract or lease takeover? Tell us what you want and " +
    "we'll match you with sellers for free. Takes about 3 minutes."
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);

  // --- About you ---
  form.addSectionHeaderItem().setTitle('About you');
  form.addTextItem().setTitle('Full name').setRequired(true);
  form.addTextItem().setTitle('Phone number').setHelpText('For texts about matches');
  form.addTextItem().setTitle('Email');
  form.addTextItem().setTitle('Facebook or Instagram name (optional)');
  form.addMultipleChoiceItem().setTitle('Best way to contact you')
    .setChoiceValues(['Text', 'Call', 'Email', 'Facebook Messenger', 'Instagram DM'])
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('School')
    .setChoiceValues(['BYU', 'UVU', 'Other / not a student'])
    .showOtherOption(false).setRequired(true);

  // --- Who's moving ---
  form.addSectionHeaderItem().setTitle("Who's moving");
  form.addMultipleChoiceItem().setTitle('How many contracts do you need?')
    .setChoiceValues(['1 (just me)', '2', '3', '4', '5', '6+']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Are you looking with a group?')
    .setChoiceValues([
      'No, just me',
      'Yes, we want to live in the same unit',
      'Yes, same complex is fine'
    ]).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Housing type')
    .setHelpText('BYU-approved housing is single-gender.')
    .setChoiceValues(["Men's", "Women's", 'Co-ed / non-approved is fine']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Do you need BYU-approved housing?')
    .setChoiceValues(['Yes', 'No', 'Not sure']).setRequired(true);

  // --- Timing ---
  form.addSectionHeaderItem().setTitle('Timing');
  form.addDateItem().setTitle('Ideal move-in date').setRequired(true);
  form.addMultipleChoiceItem().setTitle('How flexible is your move-in date?')
    .setChoiceValues(['Exact date only', 'Within a week', 'Within 2–3 weeks', 'Very flexible']);
  form.addCheckboxItem().setTitle('Which semesters do you need?')
    .setChoiceValues(['Fall', 'Winter', 'Spring', 'Summer']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Preferred contract length')
    .setChoiceValues([
      'One semester', 'Fall + Winter', 'Spring + Summer', 'Full year (12 months)', 'Flexible'
    ]);

  // --- Budget ---
  form.addSectionHeaderItem().setTitle('Budget');
  form.addMultipleChoiceItem().setTitle('Max rent per person, per month')
    .setChoiceValues([
      'Under $400', '$400–$500', '$500–$600', '$600–$700', '$700–$800', '$800+'
    ]).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Utilities')
    .setChoiceValues([
      'Must be included in rent', 'Prefer included', "Don't mind paying separately"
    ]);

  // --- The place ---
  form.addSectionHeaderItem().setTitle('The place');
  form.addMultipleChoiceItem().setTitle('Bedroom')
    .setChoiceValues(['Private room only', 'Shared room only', 'Either is fine']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Bathroom')
    .setChoiceValues(['Private bathroom', 'Shared with 1 person', 'Shared with 2+ is fine', 'No preference']);
  form.addMultipleChoiceItem().setTitle('Furnished?')
    .setChoiceValues(['Must be furnished', 'Prefer furnished', 'Unfurnished is fine']);
  form.addMultipleChoiceItem().setTitle('Washer/dryer')
    .setChoiceValues(['In the unit', 'On-site laundry is fine', 'No preference']);
  form.addCheckboxItem().setTitle('Housing type (check all you would consider)')
    .setChoiceValues(['Apartment', 'Townhouse', 'House', 'Basement apartment']);

  // --- Location ---
  form.addSectionHeaderItem().setTitle('Location');
  form.addCheckboxItem().setTitle('Areas you would live in')
    .setChoiceValues(['Provo', 'Orem', 'Vineyard', 'Springville', 'Lehi / American Fork'])
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('How close to campus do you need to be?')
    .setChoiceValues([
      'Walking distance (under 10 min)',
      'Under 10 min drive or bus',
      'Under 20 min drive',
      "Doesn't matter"
    ]);
  form.addParagraphTextItem().setTitle('Complexes you like')
    .setHelpText('e.g. Liberty Square, The Village, Wyview, King Henry, Old Mill');
  form.addParagraphTextItem().setTitle('Complexes you want to avoid');

  // --- Extras ---
  form.addSectionHeaderItem().setTitle('Extras');
  form.addMultipleChoiceItem().setTitle('Parking')
    .setChoiceValues(['Need a parking pass', 'Need covered parking', "Don't need parking"]);
  form.addMultipleChoiceItem().setTitle('Pets')
    .setChoiceValues(['I have a pet', 'I have an emotional support animal', 'No pets']);
  form.addMultipleChoiceItem().setTitle('Ward preference')
    .setChoiceValues(['Want a YSA ward with the complex', 'No preference', 'Not applicable']);
  form.addMultipleChoiceItem().setTitle('Open to lease takeovers (taking over someone\'s existing contract)?')
    .setChoiceValues(['Yes', 'Maybe, depending on the deal', 'No, new contracts only']);
  form.addParagraphTextItem().setTitle('Anything else we should know?')
    .setHelpText('Roommate preferences, accessibility needs, deal-breakers, etc.');

  // --- Consent ---
  form.addCheckboxItem().setTitle('Consent')
    .setChoiceValues(['Yes, it is OK to contact me about housing matches.'])
    .setRequired(true);

  form.setConfirmationMessage(
    "Thanks! We'll reach out when we find a contract that matches what you're looking for."
  );

  // Collect responses in a linked Google Sheet
  var ss = SpreadsheetApp.create('Buyer Preferences – Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Newer Google Forms start unpublished; publish so buyers can open the link.
  try { form.setPublished(true); } catch (e) {}

  Logger.log('Edit the form: ' + form.getEditUrl());
  Logger.log('Send to buyers: ' + form.getPublishedUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
}
