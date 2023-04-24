window.addEventListener('load', () => {
  init(4);
})

function init(size, isSoundOn = false) {
  function loadResults() {
    let results = JSON.parse(localStorage.getItem('results'))
    if (!results || !results.length) {
      return
    }

    let resultList = document.querySelector('.board__list')
    resultList.innerHTML = ''

    for (let result of results) {
      let resultItem = document.createElement('li')
      resultItem.innerHTML = `Time: <span>${getTimeString(result.seconds)}</span> , moves: <span>${result.moves}</span>`
      resultList.append(resultItem)
    }
  }

  function saveResult() {
    let results = localStorage.getItem('results')
    let currentResult = {moves: totalMoves, seconds: totalSeconds}
    if (!results || !results.length) {
      results = [currentResult]
    } else {
      results = JSON.parse(results)
      let insertIndex = 0
      for (let i = 0; i < results.length; i++) {
        if (currentResult.seconds < results[i].seconds) {
          break
        }
        insertIndex++
      }
      results.splice(insertIndex, 0, currentResult)
    }
    results = results.slice(0, 10);
    localStorage.setItem('results', JSON.stringify(results))
  }

  function swap(cell1, cell2) {
    const parent = cell1.parentNode
    const sibling = cell1.nextSibling === cell2 ? cell1 : cell1.nextSibling
    cell2.parentNode.insertBefore(cell1, cell2)
    parent.insertBefore(cell2, sibling)
  }

  function countMoves() {
    totalMoves++
    let movesCount = document.querySelector('.moves__count')
    movesCount.textContent = totalMoves.toString()
  }

  function getTimeString(seconds) {
    let minutes = Math.trunc(seconds / 60)
    if (minutes < 10) {
      minutes = '0' + minutes
    }
    let secondsLeft = seconds - (minutes * 60)
    if (secondsLeft < 10) {
      secondsLeft = '0' + secondsLeft
    }

    return minutes + ':' + secondsLeft
  }

  function resumeGame() {
    if (!timeInterval) {
      timeInterval = setInterval(() => {
        totalSeconds++
        let gameTime = document.querySelector('.time__count')
        gameTime.textContent = getTimeString(totalSeconds)
        saveGameState()
      }, 1000)

      let startBtn = document.querySelector('.btn-start')
      startBtn.textContent = 'Pause'
    }
  }

  function pauseGame() {
    if (timeInterval) {
      clearInterval(timeInterval)
      timeInterval = null
      let startBtn = document.querySelector('.btn-start')
      startBtn.textContent = 'Resume'
    }
  }

  function playMoveSound() {
    if (isSoundOn) {
      (new Audio('./sound/swipe.mp3')).play()
    }
  }

  function makeMove() {
    countMoves()
    resumeGame()
    saveGameState()
    checkVictory();
  }

  function animate(cell, empty, move, callback) {
    isAnimating = true

    let cellStyles = window.getComputedStyle(document.querySelector('.cell'));
    let marginX = parseInt(cellStyles.marginRight)
    let marginY = parseInt(cellStyles.marginBottom)

    switch (move) {
      case 'right':
        cell.style.transform = `translate(calc(100% + ${marginX}px), 0)`;
        empty.style.transform = `translate(calc(-1 * (100% + ${marginX}px)), 0)`;
        break
      case 'left':
        cell.style.transform = `translate(calc(-1 * (100% + ${marginX}px)), 0)`;
        empty.style.transform = `translate(calc(100% + ${marginX}px), 0)`;
        break
      case 'up':
        cell.style.transform = `translate(0, calc(-1 * (100% + ${marginY}px)))`;
        empty.style.transform = `translate(0, calc(100% + ${marginY}px))`;
        break
      case 'down':
        cell.style.transform = `translate(0, calc(100% + ${marginY}px))`;
        empty.style.transform = `translate(0, calc(-1 * (100% + ${marginY}px)))`;
        break
    }

    setTimeout(() => {
      cell.style.transform = 'none'
      empty.style.transform = 'none'
      callback()
      isAnimating = false
      cell.classList.remove('cell_animate')
    }, 250)
  }

  function moveTile(cell) {
    if (isAnimating) {
      return
    }

    let next = cell.nextSibling
    let prev = cell.previousSibling
    let row = cell.parentNode
    let cellIndex = [...row.childNodes].indexOf(cell)
    let nextRow = row.nextSibling
    let prevRow = row.previousSibling
    let nextRowCell = nextRow ? nextRow.childNodes[cellIndex] : null
    let prevRowCell = prevRow ? prevRow.childNodes[cellIndex] : null

    if (next && next.classList.contains('empty')) {
      playMoveSound()
      animate(cell, next, 'right', () => {
        swap(cell, next)
        makeMove()
      })
      return;
    }
    if (prev && prev.classList.contains('empty')) {
      playMoveSound()
      animate(cell, prev, 'left', () => {
        swap(cell, prev)
        makeMove()
      })
      return
    }
    if (nextRowCell && nextRowCell.classList.contains('empty')) {
      playMoveSound()
      animate(cell, nextRowCell, 'down', () => {
        swap(cell, nextRowCell)
        makeMove()
      })
      return
    }
    if (prevRowCell && prevRowCell.classList.contains('empty')) {
      playMoveSound()
      animate(cell, prevRowCell, 'up', () => {
        swap(cell, prevRowCell)
        makeMove()
      })
      return
    }
  }

  function resetGame(size) {
    pauseGame()
    clearGameState()
    init(size, isSoundOn)
  }

  function saveGameState() {
    let currentState = {
      size: size,
      moves: totalMoves,
      seconds: totalSeconds,
      board: [],
      sound: isSoundOn
    }

    let cells = document.querySelectorAll('.cell')
    for (let cell of cells) {
      currentState.board.push(parseInt(cell.textContent ? cell.textContent : 0))
    }

    localStorage.setItem('boardState', JSON.stringify(currentState))
  }

  function clearGameState() {
    localStorage.setItem('boardState', JSON.stringify({
      size: size,
      moves: 0,
      seconds: 0,
      board: [],
      sound: isSoundOn
    }))
  }

  function loadGameState() {
    try {
      return JSON.parse(localStorage.getItem('boardState'))
    } catch {
      return null
    }
  }

  function checkVictory() {
    let cells = document.querySelectorAll('.cell')
    let i = 0
    for (let cell of cells) {
      let number = parseInt(cell.textContent ? cell.textContent : 0)
      if (number && number !== i + 1) {
        return false
      }
      i++
    }

    pauseGame()
    saveResult()
    clearGameState()
    loadResults()

    let gameContainer = document.querySelector('.game__container')
    gameContainer.style.opacity = '0'

    let victory = document.querySelector('.victory')
    victory.style.top = '0'
    victory.querySelector('.victory__time').textContent = getTimeString(totalSeconds)
    victory.querySelector('.victory__moves').textContent = totalMoves.toString()
  }

  function isSolvable(items) {
    let n = Math.sqrt(items.length)
    let inversions = 0
    let emptyIndex = items.length - 1
    for (let i = 0; i < items.length - 1; i++) {
      for (let j = i+1; j < items.length; j++) {
        if (items[i] && items[j] && items[i] > items[j]) {
          inversions++
        }
      }
      if (!items[i]) {
        emptyIndex = i
      }
    }
    let emptyRow = 1 + n - Math.ceil((emptyIndex+1) / n)
    let isOddN = n % 2 !== 0
    let isEvenInversions = inversions % 2 === 0
    let isEvenEmptyRow = emptyRow % 2 === 0

    if (isOddN) {
      return isEvenInversions
    }

    return (isEvenEmptyRow && !isEvenInversions) || (!isEvenEmptyRow && isEvenInversions)
  }

  function isVictoryBoard(items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i] && items[i] !== i + 1) {
        return false
      }
    }
    return true
  }

  function createBoard(size) {
    let baseHtml = `
        <div class="game__board">
          <div class="tiles__container tiles">
              <div class="tiles__rows">
              </div>
          </div>
      </div>`

    let board = document.createElement('div')
    board.innerHTML = baseHtml

    let tries = 0
    if (!gameBoardData.length) {
      do {
        tries++
        gameBoardData = [...Array(size * size).keys()].sort(() => Math.random() - 0.5)
      } while ((!isSolvable(gameBoardData) || isVictoryBoard(gameBoardData)) && tries < 100000)
    }
    if (tries >= 100000) {
      console.error('cannot randomize puzzle')
    }

    let rows = board.querySelector('.tiles__rows')
    let row = document.createElement('div')

    for (let i = 0; i < gameBoardData.length; i++) {
      if (i % size === 0) {
        row = document.createElement('div')
        row.classList.add('row')
        rows.append(row)
      }
      let cell = document.createElement('div')
      cell.classList.add('cell', 'cell_' + size)

      if (gameBoardData[i] !== 0) {
        cell.textContent = gameBoardData[i].toString()
        cell.setAttribute('draggable', 'true')
      } else {
        cell.classList.add('empty', 'cell_animate')
      }
      row.append(cell)
    }

    return board.innerHTML
  }

  // --------------------------- init game variables ----------------------------------------------------------------//
  let totalSeconds = 0
  let totalMoves = 0
  let gameBoardData = []
  let timeInterval
  let isAnimating = false

  let loadedState = loadGameState()
  if (loadedState) {
    size = loadedState.size
    totalSeconds = loadedState.seconds
    totalMoves = loadedState.moves
    isSoundOn = loadedState.sound
    gameBoardData = loadedState.board
  }

  let body = document.querySelector('body')
  let gameBoardHtml = createBoard(size)

  // language=HTML
  body.innerHTML = `
      <div class="wrapper">
          <div class="game__container">
              <div class="header__container header">
                  <div class="header__info info">
                      <div class="info__top-row">
                          <div class="moves">
                              <div class="moves__title">Moves</div>
                              <div class="moves__count">${totalMoves}</div>
                          </div>
                          <div class="time">
                              <div class="time__title">Time</div>
                              <div class="time__count">${getTimeString(totalSeconds)}</div>
                          </div>
                      </div>
                      <div class="info__bottom-row">
                          <div class="info__start">
                              <div class="btn btn-start">Start</div>
                          </div>
                          <div class="info__reset">
                              <div class="btn btn-reset">Reset</div>
                          </div>
                          <div class="info__score">
                              <div class="btn btn-score">Score</div>
                          </div>
                      </div>
                  </div>
                <div class="header__link"><span>Fifteen</span><span>puzzle</span></div>
              </div>
              ${gameBoardHtml}
              <div class="game__size">
                  <div class="other-sizes">
                      <div class="size-list">
                          <a href="#" class="other-size" data-value="2">2x2</a>
                          <a href="#" class="other-size" data-value="3">3x3</a>
                          <a href="#" class="other-size" data-value="4">4x4</a>
                          <a href="#" class="other-size" data-value="5">5x5</a>
                          <a href="#" class="other-size" data-value="6">6x6</a>
                          <a href="#" class="other-size" data-value="7">7x7</a>
                          <a href="#" class="other-size" data-value="8">8x8</a>
                      </div>
                  </div>
                <div class="game__sound sound-on hidden">
                  <img src="./img/sound.svg" alt="sound-on">
                </div>
                <div class="game__sound sound-off hidden">
                  <img src="./img/mute.svg" alt="sound-off">
                </div>
              </div>
              <div class="game__instructions">
                  <div class="goal">Goal: Solve the puzzle by arranging the tiles in the correct order from 1 to
                      ${size * size - 1}
                  </div>
              </div>
              <div class="top-result__container">
                  <div class="top-result__board board">
                      <div class="board__title">Top 10 results</div>
                      <ul class="board__list">
                          <li class="board__list_no-result">No results yet...</li>
                      </ul>
                      <div class="close-btn"></div>
                  </div>
              </div>
          </div>
          <div class="victory">
              <div class="victory__pusheen"><img src="./img/pusheen.gif"/></div>
              <div class="victory__text">
                  Hooray! You solved the puzzle in
                  <span class="victory__time"></span>
                  and <span class="victory__moves"></span> moves!
              </div>
              <btn class="play-again">Play again!</btn>
          </div>
      </div>
  `
  // -----------------------------------init game---------------------------------------------------------------//
  loadResults();
  saveGameState()

  // -----------------------------------reset--------------------------------------------------------------------//
  let reset = document.querySelector('.info__reset')
  reset.addEventListener('click', () => {
    resetGame(size)
  })

  let startPauseBtn = document.querySelector('.info__start')
  startPauseBtn.addEventListener('click', () => {
    if (timeInterval) {
      pauseGame()
    } else {
      resumeGame()
    }
  })

  function dragStart() {
    setTimeout(() => {
      this.classList.add('empty')
    }, 0)
  }

  function dragEnd() {
    this.classList.remove('empty')
  }

  function dragOver(event) {
    if (event.preventDefault) {
      event.preventDefault()
    }
    return false
  }

  function drop(source) {
    source.classList.remove('cell_animate')
    moveTile(source)
    setTimeout(() => source.classList.add('cell_animate'), 250)
  }

  let cells = document.querySelectorAll('.cell')
  for (let cell of cells) {
    if (!cell.classList.contains('empty')) {
      cell.addEventListener('click', (e) => {
        cell.classList.add('cell_animate')
        moveTile(e.target)
      })
    } else {
      cell.addEventListener('drop', (e) => {
        drop(cell)
      })
    }
    cell.addEventListener('dragstart', dragStart)
    cell.addEventListener('dragend', dragEnd)
    cell.addEventListener('dragover', dragOver)
  }

  let selectedSize = document.querySelector(`.other-size[data-value="${size}"]`)
  if (selectedSize) {
    selectedSize.classList.add('other-size_active')
  }
  document.querySelector('.size-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('other-size')) {
      size = parseInt(e.target.dataset.value)
      resetGame(size)
      saveGameState()
    }
  })

  //______________________________________sound_________________________________________________//

  let soundOn = document.querySelector('.sound-on')
  let soundOff = document.querySelector('.sound-off')
  if (isSoundOn) {
    soundOn.classList.remove('hidden')
  } else {
    soundOff.classList.remove('hidden')
  }

  for (let elem of [soundOn, soundOff]) {
    elem.addEventListener('click', (e) => {
      if (e.currentTarget === soundOff) {
        let turnSound = new Audio('./sound/soundon.mp3')
        turnSound.volume = 0.5
        turnSound.play()
      }
      isSoundOn = !isSoundOn
      saveGameState()
      soundOn.classList.toggle('hidden')
      soundOff.classList.toggle('hidden')
    })
  }
  //______________________________________results popup_________________________________________________//

  let score = document.querySelector('.info__score')
  let topResults = document.querySelector('.top-result__container')
  let closeBtn = document.querySelector('.close-btn')
  score.addEventListener('click', () => {
    topResults.style.top = '0'
  })
  closeBtn.addEventListener('click', () => {
    topResults.style.top = '100%'
  })

  //_______________________________________victory start again __________________________________________//
  let playAgain = document.querySelector('.play-again')
  playAgain.addEventListener('click', () => resetGame(size, isSoundOn))
}