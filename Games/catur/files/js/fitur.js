document.addEventListener('DOMContentLoaded', () => {
const yearEls = document.querySelectorAll('#currentYear');
    yearEls.forEach(el => el.textContent = new Date().getFullYear());
    // --- Logika Ganti Tema & Font (5 Tema) ---
    const themes = ['blood-moon', 'abyssal-void', 'toxic-hazard', 'phantom-shadow', 'asylum'];
    let currentThemeIndex = 0;

    const themeToggler = document.getElementById('theme-toggler');
    themeToggler.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      const newTheme = themes[currentThemeIndex];
      document.body.setAttribute('data-theme', newTheme);
    });

    // --- Logika Modal untuk Cara Bermain ---
    const modalOverlay = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    function openModal(title, htmlContent) {
      modalTitle.innerHTML = title;
      modalContent.innerHTML = htmlContent;
      modalOverlay.classList.add('modal-overlay--active');
    }

    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('modal-overlay--active');
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('modal-overlay--active');
      }
    });

    document.getElementById('nav-rules').addEventListener('click', (e) => {
      e.preventDefault();
      openModal('<span class="material-icons">menu_book</span> Cara Bermain', `
        <p><strong>1. Cara Kontrol:</strong> Klik pada bidak Anda untuk melihat langkah yang valid (ditandai titik indikator), lalu klik kotak tujuan untuk memindahkan bidak.</p>
        <p style="margin-top: 0.8rem;"><strong>2. Mode Permainan:</strong> Pilih mode <em>vs Komputer</em> dengan tingkat kesulitan Easy, Normal, atau Hard, atau pilih <em>2 Player</em> untuk bermain bersama teman secara bergantian di perangkat yang sama.</p>
        <p style="margin-top: 0.8rem;"><strong>3. Ganti Tema & Font:</strong> Klik ikon roller (<span class="material-icons" style="font-size:1rem; vertical-align:middle;">imagesearch_roller</span>) di pojok kiri atas untuk berganti di antara 6 tema visual yang memiliki kombinasi warna dan gaya font unik masing-masing.</p>
      `);
    });

    // --- Logika Catur & Mode Permainan ---
    const chess = new Chess();
    const boardElement = document.getElementById('chess-board');
    const turnStatus = document.getElementById('turn-status');
    const capturedWhiteEl = document.getElementById('captured-white');
    const capturedBlackEl = document.getElementById('captured-black');

    let gameMode = 'pve'; // 'pve' atau 'pvp'
    let currentDifficulty = 'easy';
    let capturedWhite = []; 
    let capturedBlack = []; 

    const modeButtons = document.querySelectorAll('.mode-btn');
    const diffContainer = document.getElementById('difficulty-container');
    const diffButtons = document.querySelectorAll('.diff-btn');

    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;
        
        if (gameMode === 'pve') {
          diffContainer.style.display = 'flex';
        } else {
          diffContainer.style.display = 'none';
        }
        resetGame();
      });
    });

    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.level;
        resetGame();
      });
    });

    const pieceSymbols = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
      P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
    };

    let selectedSquare = null;
    let validMoves = [];

    function renderBoard() {
      boardElement.innerHTML = '';
      const boardState = chess.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const squareDiv = document.createElement('div');
          const isLight = (r + c) % 2 === 0;
          squareDiv.className = `chess-square ${isLight ? 'light' : 'dark'}`;
          
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          const squareCoord = `${file}${rank}`;

          squareDiv.dataset.square = squareCoord;

          if (selectedSquare === squareCoord) {
            squareDiv.classList.add('selected');
          }

          if (validMoves.includes(squareCoord)) {
            squareDiv.classList.add('highlight');
          }

          const piece = boardState[r][c];
          if (piece) {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'chess-piece';
            pieceDiv.textContent = piece.color === 'w' ? pieceSymbols[piece.type.toUpperCase()] : pieceSymbols[piece.type];
            pieceDiv.style.color = piece.color === 'w' ? '#f8fafc' : '#0f172a';
            pieceDiv.style.textShadow = piece.color === 'w' ? '0 0 3px rgba(0,0,0,0.8)' : '0 0 3px rgba(255,255,255,0.4)';
            squareDiv.appendChild(pieceDiv);
          }

          squareDiv.addEventListener('click', () => handleSquareClick(squareCoord));
          boardElement.appendChild(squareDiv);
        }
      }

      updateStatus();
      updateCapturedUI();
    }

    function handleSquareClick(square) {
      if (chess.game_over()) return;

      if (gameMode === 'pve' && chess.turn() === 'b') return;

      if (selectedSquare === null) {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          selectedSquare = square;
          validMoves = chess.moves({ square: square, verbose: true }).map(m => m.to);
          renderBoard();
        }
      } else {
        if (selectedSquare === square) {
          selectedSquare = null;
          validMoves = [];
          renderBoard();
          return;
        }

        const targetPiece = chess.get(square);

        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q'
        });

        if (move === null) {
          const piece = chess.get(square);
          if (piece && piece.color === chess.turn()) {
            selectedSquare = square;
            validMoves = chess.moves({ square: square, verbose: true }).map(m => m.to);
            renderBoard();
          } else {
            selectedSquare = null;
            validMoves = [];
            renderBoard();
          }
        } else {
          if (targetPiece) {
            if (targetPiece.color === 'w') {
              capturedWhite.push(pieceSymbols[targetPiece.type.toUpperCase()]);
            } else {
              capturedBlack.push(pieceSymbols[targetPiece.type]);
            }
          }

          selectedSquare = null;
          validMoves = [];
          renderBoard();

          if (gameMode === 'pve' && !chess.game_over() && chess.turn() === 'b') {
            turnStatus.textContent = "Komputer sedang berpikir...";
            setTimeout(makeComputerMove, 300);
          }
        }
      }
    }

    // --- LOGIKA KOMPUTER ---
    function makeComputerMove() {
      const possibleMoves = chess.moves({ verbose: true });
      if (possibleMoves.length === 0) return;

      let chosenMove = null;

      if (currentDifficulty === 'easy') {
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        chosenMove = possibleMoves[randomIndex];
      } 
      else if (currentDifficulty === 'normal') {
        const captureMoves = possibleMoves.filter(m => m.captured);
        if (captureMoves.length > 0) {
          chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        } else {
          chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
      } 
      else if (currentDifficulty === 'hard') {
        let bestScore = -9999;
        let bestMoves = [];

        for (let i = 0; i < possibleMoves.length; i++) {
          let move = possibleMoves[i];
          chess.move(move);
          let score = minimax(1, false, -10000, 10000);
          chess.undo();

          if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
          } else if (score === bestScore) {
            bestMoves.push(move);
          }
        }
        chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)] || possibleMoves[0];
      }

      if (chosenMove) {
        const targetPiece = chess.get(chosenMove.to);
        if (targetPiece && targetPiece.color === 'w') {
          capturedWhite.push(pieceSymbols[targetPiece.type.toUpperCase()]);
        }

        chess.move(chosenMove);
      }
      renderBoard();
    }

    function evaluateBoard(board) {
      let totalEvaluation = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          let piece = board[r][c];
          if (piece) {
            totalEvaluation += getPieceValue(piece);
          }
        }
      }
      return totalEvaluation;
    }

    function getPieceValue(piece) {
      if (!piece) return 0;
      const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
      let val = values[piece.type];
      return piece.color === 'b' ? val : -val;
    }

    function minimax(depth, isMaximizing, alpha, beta) {
      if (depth === 0 || chess.game_over()) {
        return evaluateBoard(chess.board());
      }

      let possibleMoves = chess.moves({ verbose: true });

      if (isMaximizing) {
        let maxEval = -9999;
        for (let i = 0; i < possibleMoves.length; i++) {
          chess.move(possibleMoves[i]);
          let evaluation = minimax(depth - 1, false, alpha, beta);
          chess.undo();
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = 9999;
        for (let i = 0; i < possibleMoves.length; i++) {
          chess.move(possibleMoves[i]);
          let evaluation = minimax(depth - 1, true, alpha, beta);
          chess.undo();
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    function updateCapturedUI() {
      capturedWhiteEl.innerHTML = capturedWhite.map(p => `<span class="captured-piece-item">${p}</span>`).join(' ');
      capturedBlackEl.innerHTML = capturedBlack.map(p => `<span class="captured-piece-item">${p}</span>`).join(' ');
    }

    function updateStatus() {
      let status = '';
      let turnText = '';

      if (gameMode === 'pve') {
        turnText = chess.turn() === 'w' ? 'Putih (Anda)' : 'Hitam (Komputer)';
      } else {
        turnText = chess.turn() === 'w' ? 'Putih' : 'Hitam';
      }

      if (chess.in_checkmate()) {
        status = `Skakmat! ${chess.turn() === 'w' ? 'Hitam' : 'Putih'} Menang!`;
      } else if (chess.in_draw()) {
        status = 'Permainan Berakhir Seri (Draw)';
      } else {
        status = `Giliran: ${turnText}`;
        if (chess.in_check()) {
          status += ' (SKAK!)';
        }
      }
      turnStatus.textContent = status;
    }

    function resetGame() {
      chess.reset();
      selectedSquare = null;
      validMoves = [];
      capturedWhite = [];
      capturedBlack = [];
      renderBoard();
    }

    renderBoard();
}
