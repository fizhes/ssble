// Loeffler

const colors = {
  correct: 'green',
  wrong: 'gray',
  wrongPlace: 'rgb(170, 170, 0)'
}

function isWord(args) {
  for(const [ w, t, ts ] of fivePhonemeWords) {
    if(args.word) {
      if(w.toLowerCase() === args.word.toLowerCase())
        return true
    } else if(args.transcription) {
      if(t.join(' ') === args.transcription.join(' '))
        return true
    }
  }
  return false
}

const game = document.getElementById('game')
const winOverlay = document.getElementById('win-overlay')
const loseOverlay = document.getElementById('lose-overlay')

winOverlay.hidden = true
loseOverlay.hidden = true

const params = new URLSearchParams(window.location.search)
const isInteger = value => value && !isNaN(value) && Number.isInteger(+value)

const paramIndex = params.get('index')
let index = Math.floor(Math.random() * fivePhonemeWords.length)
if(isInteger(paramIndex) && +paramIndex >= 0) {
  index = +paramIndex
}

let [ word, transcription, transcriptionStressed ] = fivePhonemeWords[index]

const paramGuesses = params.get('guesses')
let guessCount = 6
if(isInteger(paramGuesses) && +paramGuesses > 0) {
  guessCount = +paramGuesses
}


const guessTable = document.getElementById('guess-table')
const guessTRs = Array(guessCount).fill(0).map((q, i) => {
  const tr = document.createElement('tr')
  for(let i = 0; i < 5; i++) {
    const td = document.createElement('td')
    td.className = 'guess-box'
    td.style.width = td.style.height = `${window.innerHeight / (2 * guessCount)}px`
    td.style.fontSize = `${window.innerHeight / (2 * guessCount) * 0.8}px`
    tr.appendChild(td)
  }
  guessTable.appendChild(tr)

  return tr
})
const guessTDs = Array(guessTRs.length).fill(0).map((q, i) => [...guessTRs[i].getElementsByTagName('td')])

let rowIndex = 0
let letterIndex = 0
let guess = []

let haveWon = false


const keyTDs = document.getElementsByClassName('key')
for(const el of keyTDs) {
  const phoneme = el.innerHTML
  const encoding = el.accessKey || el.innerHTML

  el.onclick = evt => {
    if(rowIndex < guessTRs.length && letterIndex < guessTDs[rowIndex].length) {
      guessTDs[rowIndex][letterIndex].innerHTML = phoneme
      guess.push(encoding)

      letterIndex++
    }
  }
}


document.getElementById('backspace-key').onclick = evt => {
  if(guess.length > 0) {
    guess.splice(guess.length - 1, 1)
    letterIndex--
    guessTDs[rowIndex][letterIndex].innerHTML = ''
  }
}

document.getElementById('enter-key').onclick = evt => {
  if(guess.length === guessTDs[rowIndex].length) {
    // check if guess is a word in CUBE
    if(!isWord({ transcription: guess })) {
      const popup = document.getElementById('not-a-word-popup')
      popup.classList.add('fadeinout')
      setTimeout(() => { popup.classList.remove('fadeinout')}, 2000);
      return
    }

    let correct = true
    for(let i = 0; i < guess.length; i++) {
      if(guess[i] === transcription[i]) {
        guessTDs[rowIndex][i].style.backgroundColor = colors.correct
      } else {
        correct = false
        guessTDs[rowIndex][i].style.backgroundColor = (
          transcription.includes(guess[i]) &&
            transcription.filter(p => p === guess[i]).length >= guess.slice(0, i + 1).filter(p => p === guess[i]).length
          ? colors.wrongPlace : colors.wrong
        )
      }

      const guessColor = guessTDs[rowIndex][i].style.backgroundColor

      for(const el of keyTDs) {
        if((el.accessKey || el.innerHTML) !== guess[i]) continue
        const elColor = el.style.backgroundColor
        if(elColor === '' || (elColor === colors.wrong && guessColor !== colors.wrong) || (elColor === colors.wrongPlace && guessColor === colors.correct))
          el.style.backgroundColor = guessColor
      }
    }

    rowIndex++
    
    if(correct) { 
      win()
    } else if(rowIndex >= guessTRs.length) {
      lose()
    }
    
    letterIndex = 0
    guess = []

  }
}

function getTranscription() {
  const out = []
  for(let p of [...transcriptionStressed]) {
    if(Object.keys(symbolMap).includes(p))
      out.push(symbolMap[p])
    else
      out.push(p)
  }

  return out.join(' ')
}

function getResults() {
  const rows = []
  for(const row of guessTDs) {
    let str = ''
    for(const td of row) {
      if(!Object.values(colors).includes(td.style.backgroundColor)) return rows

      str += td.style.backgroundColor === colors.wrong ? '⬜' : td.style.backgroundColor === colors.wrongPlace ? '🟨' : '🟩'
    }
    rows.push(str)
  }
  return rows
}

function win() {
  haveWon = true

  game.hidden = true
  document.getElementById('win-overlay').hidden = false

  document.getElementById('win-word-info-span').innerHTML = `${index}: <i>${word}</i>, <b>${getTranscription()}</b>`
  document.getElementById('win-results').innerHTML = getResults().join('<br/>')

}

function lose() {

  document.getElementById('game').hidden = true
  document.getElementById('lose-overlay').hidden = false

  document.getElementById('lose-word-info-span').innerHTML = `${index}: <i>${word}</i>, <b>${getTranscription()}</b>`
  document.getElementById('lose-results').innerHTML = getResults().join('<br/>')
}


function copyResults() {
  const results = getResults()
  navigator.clipboard.writeText(
`SSB-phoneme-le #${index}: ${haveWon ? results.length : 'X'}/${guessCount}
${results.join('\n')}`
  )

  const copyIndicator = document.getElementById(`${haveWon ? 'win' : 'lose'}-copy-indicator`)
  copyIndicator.className = 'fadeinout'
  setTimeout(() => { copyIndicator.className = '' }, 4000)
}

function copyLink() {
  navigator.clipboard.writeText(window.location.origin + window.location.pathname + `?index=${index}&guesses=${guessCount}`)
  
  const copyIndicator = document.getElementById(`${haveWon ? 'win' : 'lose'}-copy-indicator`)
  copyIndicator.className = 'fadeinout'
  setTimeout(() => { copyIndicator.className = '' }, 4000)
}

const feedbackA = document.getElementById('custom-link-feedback')
function copyCustomLink() {
  const word = document.getElementById('custom-word-input').value
  if(!isWord({ word: word })) {
    alert('not a word in CUBE, or not five phonemes.')
  } else {
    const customWordIndex = fivePhonemeWords.findIndex(([w, t, ts]) => w.toLowerCase() === word)
    const customGuessCount = +document.getElementById('custom-guess-count-input').value

    navigator.clipboard.writeText(window.location.origin + window.location.pathname + `?index=${customWordIndex}&guesses=${customGuessCount}`)

    feedbackA.className = 'fadeinout'
    setTimeout(() => { feedbackA.className = '' }, 4000)
    feedbackA.innerText = 'copied!'
  }
}

function playAgain() {
  window.location = window.location.origin + window.location.pathname
}