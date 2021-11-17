/* global fieldProperties, setAnswer, goToNextField, getPluginParameter */

var choices = fieldProperties.CHOICES
var appearance = fieldProperties.APPEARANCE
var fieldType = fieldProperties.FIELDTYPE
var numChoices = choices.length

var labelContainer = document.querySelector('#label')
var hintContainer = document.querySelector('#hint')
var filterBox = document.querySelector('#filter-text')

var choiceContainers // Will eventually contain all choice containers, either from no appearance, or 'list-nolabel' appearance
var radioButtonsContainer = document.querySelector('#radio-buttons-container') // default radio buttons
var selectDropDownContainer = document.querySelector('#select-dropdown-container') // minimal appearance
var likertContainer = document.querySelector('#likert-container') // likert
var choiceLabelContainer = document.querySelector('#choice-labels')
var listNoLabelContainer = document.querySelector('#list-nolabel')

var labelOrLnl

if (appearance.indexOf('label') === -1) {
  labelOrLnl = false
} else {
  labelOrLnl = true
}

// Create a list of choice values that should be included and excluded. If there are none, then it will be an empty list.

var excludeString = getPluginParameter('exclude')
var includeString = getPluginParameter('include')

if (getPluginParameter('search') === 1) {
  var searchable = true
  filterBox.style.display = ''
} else {
  var searchable = false
}

if ((excludeString == null) || (excludeString === '')) {
  var excludeList = []
} else {
  var excludeList = excludeString.split(' ')
}

if ((includeString == null) || (includeString === '')) {
  var includeList = []
} else {
  var includeList = includeString.split(' ')
}

if (labelOrLnl) {
  choiceContainers = document.querySelectorAll('.fl-radio') // Go through all  the available choices if 'list-nolabel'
} else {
  choiceContainers = document.querySelectorAll('.choice-container') // go through all the available choices
}

if (!labelOrLnl) {
  if (fieldProperties.LABEL) {
    labelContainer.innerHTML = unEntity(fieldProperties.LABEL)
  }
  if (fieldProperties.HINT) {
    hintContainer.innerHTML = unEntity(fieldProperties.HINT)
  }
}

// Prepare the current webview, making adjustments for any appearance options
if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) { // minimal appearance
  removeContainer('minimal')
  selectDropDownContainer.style.display = 'block' // show the select dropdown
} else if (appearance.indexOf('list-nolabel') !== -1) { // list-nolabel appearance
  removeContainer('nolabel')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else if (labelOrLnl) { // If 'label' appearance
  removeContainer('label')
  labelContainer.parentElement.removeChild(labelContainer)
  hintContainer.parentElement.removeChild(hintContainer)
} else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
  removeContainer('likert')
  likertContainer.style.display = 'flex' // show the likert container
  // likert-min appearance
  if (appearance.indexOf('likert-min') !== -1) {
    var likertChoices = document.querySelectorAll('.likert-choice-container')
    for (var i = 1; i < likertChoices.length - 1; i++) {
      likertChoices[i].querySelector('.likert-choice-label').style.display = 'none' // hide all choice labels except the first and last
    }
    likertChoices[0].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-first') // apply a special class to the first choice label
    likertChoices[likertChoices.length - 1].querySelector('.likert-choice-label').classList.add('likert-min-choice-label-last') // apply a special class to the last choice label
  }
} else { // all other appearances
  removeContainer('radio')
  if (fieldProperties.LANGUAGE !== null && isRTL(fieldProperties.LANGUAGE)) {
    radioButtonsContainer.dir = 'rtl'
  }

  // quick appearance
  if ((appearance.indexOf('quick') !== -1) && (fieldType === 'select_one')) {
    for (var i = 0; i < choiceContainers.length; i++) {
      choiceContainers[i].classList.add('appearance-quick') // add the 'appearance-quick' class
      choiceContainers[i].querySelectorAll('.choice-label-text')[0].insertAdjacentHTML('beforeend', '<svg class="quick-appearance-icon"><use xlink:href="#quick-appearance-icon" /></svg>') // insert the 'quick' icon
    }
  }
}

// minimal appearance
if ((appearance.indexOf('minimal') !== -1) && (fieldType === 'select_one')) {
  selectDropDownContainer.onchange = change // when the select dropdown is changed, call the change() function (which will update the current value)
} else if ((appearance.indexOf('likert') !== -1) && (fieldType === 'select_one')) { // likert appearance
  var likertButtons = document.querySelectorAll('div[name="opt"]')
  for (var i = 0; i < likertButtons.length; i++) {
    likertButtons[i].onclick = function () {
      // clear previously selected option (if any)
      var selectedOption = document.querySelector('.likert-input-button.selected')
      if (selectedOption) {
        selectedOption.classList.remove('selected')
      }
      this.classList.add('selected') // mark clicked option as selected
      change.apply({ value: this.getAttribute('data-value') }) // call the change() function and tell it which value was selected
    }
  }
} else { // all other appearances
  var buttons = document.querySelectorAll('input[name="opt"]')
  var numButtons = buttons.length
  if (fieldType === 'select_one') { // Change to radio buttons if select_one
    for (var i = 0; i < numButtons; i++) {
      buttons[i].type = 'radio'
    }
  }
  for (var i = 0; i < numButtons; i++) {
    buttons[i].onchange = function () {
      // remove 'selected' class from a previously selected option (if any)
      var selectedOption = document.querySelector('.choice-container.selected')
      if ((selectedOption) && (fieldType === 'select_one')) {
        selectedOption.classList.remove('selected')
      }
      this.parentElement.classList.add('selected') // add 'selected' class to the new selected option
      change.apply(this) // call the change() function and tell it which value was selected
    }
  }
}

var indChoices = document.querySelectorAll('.main-choice') // All individual choices, so they can be removed as needed.

// Remove choices that should be hidden
var valueList = [] // Stores list of values that still exist, so they can be checked later for the filter.
var remainingChoiceDict = {}
if (excludeList.length > 0) {
  for (var c = 0; c < numChoices; c++) {
    var indChoice = indChoices[c] // Choice element
    var choiceValue = indChoice.id.substr(7) // Choice value. Uses the "id" attrinute, and always starts with "choice-", so remove that.
    if ((excludeList.indexOf(choiceValue) >= 0) && (includeList.indexOf(choiceValue) === -1)) {
      indChoice.parentElement.removeChild(indChoice)
    } else {
      remainingChoiceDict[choiceValue] = indChoice
    }
  }
} else if (includeList.length > 0) {
  for (var c = 0; c < numChoices; c++) {
    var indChoice = indChoices[c]
    var choiceValue = indChoice.id.substr(7)
    if (includeList.indexOf(choiceValue) === -1) {
      indChoice.parentElement.removeChild(indChoice)
    } else {
      remainingChoiceDict[choiceValue] = indChoice
    }
  }
}

// Filter choices based on search box
if (searchable) {
  var remainingChoices = document.querySelectorAll('.main-choice') // Get all the remaining choices after the filtered ones have been removed.
  var numRemaining = remainingChoices.length // Number of remaining choices

  var labelDict = {}
  for (var c = 0; c < numChoices; c++) { // Create an object of each choice label, so they can easily be checked, and if the search term cannot be found, then the corresponding choice container will be removed. Retrieve even the removed ones, since easier to cycle through.
    var choice = choices[c]
    var choiceLabel = choice.CHOICE_LABEL.toLowerCase()
    var choiceValue = choice.CHOICE_VALUE
    labelDict[choiceValue] = choiceLabel
  }

  filterBox.addEventListener('input', function () { // When the text is changed, go through each item in "remainingChoiceDict", retrieve its key, which is the choice value. Use that to retrieve its label from "labelDict", and check if that label contains the search text. If it doesn't, then use "remainingChoiceDict" to get the element and hide it.
    var filterText = filterBox.value.toLowerCase() // Make not case sensitive
    for (var choiceValue in remainingChoiceDict) {
      var choiceLabel = labelDict[choiceValue]
      if (choiceLabel.indexOf(filterText) === -1) {
        remainingChoiceDict[choiceValue].style.display = 'none'
      } else {
        remainingChoiceDict[choiceValue].style.display = ''
      }
    }
  })
}

// END filter box setup

function clearAnswer () {
  // minimal appearance
  if (appearance.indexOf('minimal') !== -1) {
    selectDropDownContainer.value = ''
  } else if (appearance.indexOf('likert') !== -1) { // likert appearance
    var selectedOption = document.querySelector('.likert-input-button.selected')
    if (selectedOption) {
      selectedOption.classList.remove('selected')
    }
  } else { // all other appearances
    for (var b = 0; b < numButtons; b++) {
      var selectedOption = buttons[b]
      selectedOption.checked = false
      selectedOption.parentElement.classList.remove('selected')
    }
  }
  setAnswer('')
}

// Removed the containers that are not to be used
function removeContainer (keep) {
  if (keep !== 'radio') {
    radioButtonsContainer.parentElement.removeChild(radioButtonsContainer) // remove the default radio buttons
  }

  if (keep !== 'minimal') {
    selectDropDownContainer.parentElement.removeChild(selectDropDownContainer) // remove the select dropdown contrainer
  }

  if (keep !== 'likert') {
    likertContainer.parentElement.removeChild(likertContainer) // remove the likert container
  }

  if (keep !== 'label') {
    choiceLabelContainer.parentElement.removeChild(choiceLabelContainer)
  }

  if (keep !== 'nolabel') {
    listNoLabelContainer.parentElement.removeChild(listNoLabelContainer)
  }
}

// Save the user's response (update the current answer)
function change () {
  if (fieldType === 'select_one') {
    setAnswer(this.value)
    // If the appearance is 'quick', then also progress to the next field
    if (appearance.indexOf('quick') !== -1) {
      goToNextField()
    }
  } else {
    var selected = []
    for (var c = 0; c < numChoices; c++) {
      if (choiceContainers[c].querySelector('INPUT').checked === true) {
        selected.push(choices[c].CHOICE_VALUE)
      }
    }
    setAnswer(selected.join(' '))
  }
}

// If the field label or hint contain any HTML that isn't in the form definition, then the < and > characters will have been replaced by their HTML character entities, and the HTML won't render. We need to turn those HTML entities back to actual < and > characters so that the HTML renders properly. This will allow you to render HTML from field references in your field label or hint.
function unEntity (str) {
  return str.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// Detect right-to-left languages
function isRTL (s) {
  var ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' + '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF'
  var rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC'
  var rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']')

  return rtlDirCheck.test(s)
}
