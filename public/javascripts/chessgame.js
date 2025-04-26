const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessBoard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let selectedSquare=null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowindex + squareindex) % 2 === 0 ? "light" : "dark");

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                // Drag functionality
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = null;
                        sourceSquare = null;
                    }
                });

                squareElement.appendChild(pieceElement);
            }

            // Drop functionality
            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });
            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            // CLICK functionality
            squareElement.addEventListener("click", function (e) {
                const clickedSquare = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col),
                };

                if (selectedSquare) {
                    handleMove(selectedSquare, clickedSquare);
                    selectedSquare = null;
                    clearHighlights();
                } else {
                    const piece = chess.board()[clickedSquare.row][clickedSquare.col];
                    if (piece && piece.color === playerRole) {
                        selectedSquare = clickedSquare;
                        highlightSquare(squareElement);
                    }
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};
const highlightSquare = (squareElement) => {
    clearHighlights();
    squareElement.classList.add("highlight");
};

const clearHighlights = () => {
    document.querySelectorAll(".square.highlight").forEach(sq => {
        sq.classList.remove("highlight");
    });
};
const handleMove = (source, target) => {
    // Prevent moves to the same square
    if (source.row === target.row && source.col === target.col) return;

    const move = {
        from : `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to : `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion : 'q',
        
    };
    console.log("`${String.fromCharCode(97 + source.col)}${8 - source.row}`");
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePiece = {
        R  :  "♖",
        K  :  "♔",
        Q  :  "♕",
        B  :  "♗",
        N  :  "♘",
        P  :  "♙",
        k  :  "♚",
        q  :  "♛",
        r  :  "♜",
        b  :  "♝",
        n  :  "♞",
        p  :  "♟",
    };
    return unicodePiece[piece.type] || "";
};
socket.on("playerRole",function(role){
    playerRole = role;
    renderBoard();
});
socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});
let previousMoveSAN = null;

socket.on("move", function(move){
    const result = chess.move(move);
    if(result === null){
        console.log("Invalid move received");
        return;
    }
    renderBoard();

    const latestMoveElement = document.getElementById("l1");
    const previousMoveElement = document.getElementById("l2");

    if (latestMoveElement) {
        latestMoveElement.textContent = `Latest move: ${result.san}`;
    }
    if (previousMoveElement) {
        previousMoveElement.textContent = previousMoveSAN ? `Previous move: ${previousMoveSAN}` : "";
    }

    // Update previous move for next time
    previousMoveSAN = result.san;
});

renderBoard();