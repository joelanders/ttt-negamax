max = function( ary ) { 
    biggest = -99;
    for(var i = 0; i < ary.length; i++ ) { 
        biggest = ary[i] > biggest ? ary[i] : biggest;
    }   
    return biggest;
}

other = function( sym ) {
    if (sym == 'x') {
        return 'o';
    }
    return 'x';
}

// I'm keeping track of the game board by subbing into a string of
// numbers. Makes it easy to check for wins. Easier to work with
// by hand than nested arrays. Found the idea on some Perl golfing
// discussion a while back after I was unhappy with overly-OO TTT
// board I saw at DBC.
//
// Winning algorithm is negamax. Got the algorithm working on a
// simpler game (get 2 xs or os in a row in a board of 1,2,3,4)
// before applying it to a tic-tac-toe board.
//
// I do a very simple, braindead speedup for when the computer is
// making its first move (2nd move of the game). If the player
// picked the center square, pick the top left square. Otherwise,
// pick the center square.

function T3State( state ) {
    this.state = state || '123456789147258369159357';
    this.winner = function() {
        var threeInARow = this.state.match( /^(.{3})*(xxx|ooo)(.{3})*$/ );
        if ( threeInARow ) {
            return threeInARow[2].charAt(0);
        }
        var noSpacesLeft = !this.state.match( /\d/ );
        if ( noSpacesLeft ) {
            return 't';
        }
        return false;
    }
    this.placeCopy = function( symbol, position ) {
        var regex = new RegExp( position.toString(), "g" );
        return this.state.replace( regex, symbol );
    }
    this.place = function( symbol, position ) {
        this.state = this.placeCopy( symbol, position );
        document.getElementsByClassName( position )[0].className += (' '+symbol);
        return this.state;
    }
    this.placesLeft = function() {
        var places = [];
        var that = this;
        // if the space is still on the board and isn't yet
        // in our list of things still on the board...
        // maybe easier to just maintain an array of these
        // on board initialization and move placement.
        [1,2,3,4,5,6,7,8,9].forEach( function(place) {
            if ( that.state.indexOf( place.toString() ) != -1 ) {
                if ( places.indexOf( place.toString() ) == -1 ) {
                    places.push( place.toString() );
                }
            }
        });
        return places;
    }
    this.children = function( newSymbol ) {
        var that = this;
        return this.placesLeft(this.state).map( function(place) {
            return new T3State( that.placeCopy( newSymbol, place ) )
        });
    }
    this.negaScore = function( symbol ) {
        var possibleWinner = this.winner();
        if (possibleWinner == symbol) {
            return 1;
        }
        if (possibleWinner == other(symbol)) {
            return -1;
        }
        if (possibleWinner == 't') {
            return 0;
        }
        return max( this.children(symbol).map( function(child){
            var ns = -1 * child.negaScore( other(symbol) );
            return ns;
        }));
    }
    this.calcChildrenScores = function( symbol ) {
        var childrenScores = {};
        var that = this;
        this.placesLeft().forEach( function(place) {
            var newt3 = new T3State(that.placeCopy(symbol, place));
            childrenScores[place] = newt3.negaScore( other(symbol) );
        });
        return childrenScores;
    }
    this.bestMove = function( childrenScores ) {
        var bestPosition = null;
        var smallestScore = 100;
        [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach( function(place) {
            if ( childrenScores[place.toString()] < smallestScore ) {
                bestPosition = place;
                smallestScore = childrenScores[place.toString()];
            }
        });
        return bestPosition;
    }
    this.makeBestMove = function( symbol ) {
        this.place( symbol, this.bestMove (this.calcChildrenScores( symbol ) ) );
    }
    this.placeAndAI = function ( symbol, position ) {
        this.place( symbol, position );
        if (this.placesLeft().length == 8) {
            if (position == '5') {
                this.place( other( symbol ), "1" );
            } else {
                this.place( other( symbol ), "5" );
            }
        } else {
            this.makeBestMove( other( symbol ) );
        }
    }
}

//b = new T3State('xx3ox6789xo7xx8369xx93x7')
//b.makeBestMove('x');
//
//
//b.state = 'x23456789x47258369x59357'
//b.makeBestMove('o');
//
//b.state = '123456789147258369159357'
//b.makeBestMove('o');


//// winner
//t = new T3State();
//assert( t.winner() == false );
//// spaces 4,5,6 = 'o' is a win
//t.state = '123ooo789'
//assert( t.winner() == 'o' );
//// spaces 1,2,3 = 'x' is a win
//t.state = 'xxx456789'
//assert( t.winner() == 'x' );
//// spaces 3,4,5 = 'o' is not a win
//t.state = '12ooo6789'
//assert( t.winner() == false );
//// no spaces left is a tie
//t.state = 'xoxoxoxox'
//assert( t.winner() == 't' )
//
////place
//t = new T3State();
//t.place( 'x', 1 )
//assert( t.state == 'x23456789x47258369x59357' )
//t.place( 'o', 3 )
//assert( t.state == 'x2o456789x47258o69x59o57' )
//t.place( 'x', 6 )
//assert( t.state == 'x2o45x789x47258ox9x59o57' )
//
////placesLeft
//t = new T3State('x2o45x789x47258ox9x59o57');
//assert( t.placesLeft().toString() == '2,4,5,7,8,9' )
//t.state = 'x2oo5x789xo7258ox9x59o57'
//assert( t.placesLeft().toString() == '2,5,7,8,9' )
//
////children
//t = new T3State('x23456789x47258369x59357')
//assert( t.children('x')[0].state == 'xx3456789x47x58369x59357' )
//t = new T3State('xxoooxx89xoxxo8ox9xo9oox')
//assert( t.children('x')[0].state == 'xxoooxxx9xoxxoxox9xo9oox' )
//assert( t.children('x')[1].state == 'xxoooxx8xxoxxo8oxxxoxoox' )
//
////negaScore
//t = new T3State('xx3xo6')
//assert( t.negaScore('x') == 1 )
//t = new T3State('xxxxo6')
//assert( t.negaScore('o') == -1 )
//t = new T3State('xx3xox')
//assert( t.negaScore('o') == 0 )
//t = new T3State('xxoxox')
//assert( t.negaScore('x') == 0 )
//
////calcChildrenScores
//t = new T3State('xx3xo6')
//assert( t.calcChildrenScores('x')['3'] == -1 )
//assert( t.calcChildrenScores('x')['6'] == 0 )
//
////bestMove
//t = new T3State('xxxxxo')
//assert( t.bestMove( {'3': -1, '6': 0} ) == 3 )
//assert( t.bestMove( {'3': 1, '6': 0} ) == 6 )
