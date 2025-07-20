# Farcade SDK

The Farcade SDK enables game developers to integrate their HTML5 games with the Farcade platform through a simple messaging interface.

## Installation

Install the SDK using your preferred package manager:

```sh
npm install @farcade/game-sdk
# or
yarn add @farcade/game-sdk
# or
pnpm add @farcade/game-sdk
```

## Quick Start

```typescript
import { sdk } from '@farcade/game-sdk'

// Notify Farcade when your game is ready to be played
sdk.singlePlayer.actions.ready()

// Report the game score when the game is over
sdk.singlePlayer.actions.gameOver({ score: 1000 })

// Trigger haptic feedback, if available
sdk.singlePlayer.actions.hapticFeedback()

// Listen for events from Farcade
sdk.on('play_again', () => {
  // Reset your game state here
})

sdk.on('toggle_mute', (data) => {
  // Handle mute state changes
  console.log('Mute state changed:', data.isMuted)
})

sdk.on('game_info', (data) => {
  // Consume user data in your game
  console.log('Recieved players: ', data.players)
  console.log('Current player id: ', data.meId)
})
```

## API Reference

### Single Player Actions

#### `sdk.singlePlayer.actions.ready()`

Call this method when your game has finished loading and is ready to be played.

#### `sdk.singlePlayer.actions.gameOver({ score: number })`

Call this method when the game is over to report the final score.

Parameters:

- `score`: The player's final score (number)

#### `sdk.singlePlayer.actions.hapticFeedback()`

Call this method to trigger haptic feedback on supported devices. Use this for important game events like collisions, achievements, or other significant player interactions.

```typescript
// Example usage
sdk.singlePlayer.actions.hapticFeedback() // Triggers a haptic pulse
```

### Multi-Player Actions

Muliplayer has the same actions as singlePlayer with 1 update and 2 additions. It is important to note that you
MUST listen for the `game_info` event type in order to accurately report scores when the game ends.

#### `sdk.multiplayer.actions.gameOver({ scores: { playerId: string; score: number }[] })`

Call this method with the game is over to report the final scores. You must be listening for the `game_info` event to get the playerIds you'll need to submit the scores.

Parameters:

- `scores`: The playerId and score for each player in the game.

#### `sdk.multiplayer.actions.updateGameState({ data: Record<string, unknown>; alertUserIds: string[] })`

Call this method when a player action should update the shared game state for all players. Optionally, you may include an array of user ids that should be alerted that it is their turn.

Parameters:

- `data`: A Record object containing your game state. The shape of the game state is open to the game creator's discretion.
- `alertUserIds`: A list of user ids to alert on this game state update. Typically this will be a list of length 1 containing the id of the user who is next to act, but different games may need to alert multiple users.

#### `sdk.multiplayer.actions.refuteGameState({ gameStateId: string })`

Call this method when your game client has determined an incoming game state is invalid. It is not strictly required that your game validates game state updates, but it should. Putting game state validation logic in your game client means that bad actors attempting to push unfair updates are invalidated by good actors running valid implementations of your game.

Parameters:

- `gameStateId`: The id from the `game_state_updated` event that the game client is refutting.


Here is an example function that handles update and refute game state for a Chess game:

```javascript
  handleGameStateUpdate({ gameState }) {
    if (!gameState) return;

    const { id, data: { moves } } = gameState;

    try {
      this.chess.reset();
      if (moves?.length > 0) {
        for (const move of moves) {
          this.chess.move(move);
        }
      }
      this.renderBoard();
      this.updateStatus();
      this.updateMoveHistory();
      this.updateCapturedPieces();
    } catch (error) {
      // game state is invalid, refuting this game state update
      window.FarcadeSDK.multiplayer.actions.refuteGameState(id);
    }
  }
```

### Events

#### `sdk.on(eventName, callback)`

Register a callback function for specific events. Available events:

- `'play_again'`: Called when the player wants to play again
- `'toggle_mute'`: Called when receiving mute state changes. Receives data with `{ isMuted: boolean }`
- `'game_info'`: Called after the game calls the ready event. Receives data with `{ players: { id: string; name: string; imageUrl?: string }[], meId: string }`
- `'game_state_updated'`: Called in muliplayer games when there is an update to the game state. Receives data with: `{ id: string, data: unknown }`

Parameters:
- `eventName`: The event to listen for (`'play_again'` | `'toggle_mute'` | `'game_info'` | `'game_state_updated'` )
- `callback`: Function to be called when the event is received

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. The following types are available for import:

```typescript
import type {
  FarcadeSDK,
  ReadyEvent,
  PlayAgainEvent,
  SinglePlayerGameOverEvent,
  HapticFeedbackEvent,
  ToggleMuteEvent
} from '@farcade/game-sdk'
```

## Example Single Player Implementation

```typescript
import { sdk } from '@farcade/game-sdk'

class Game {
  constructor() {
    // Initialize your game
    this.initialize()

    // Setup event listeners
    this.setupEventListeners()

    // Notify when ready
    sdk.singlePlayer.actions.ready()
  }

  private setupEventListeners() {
    // Listen for play again events
    sdk.on('play_again', () => {
      this.resetGame()
    })

    // Listen for mute state changes
    sdk.on('toggle_mute', (data) => {
      this.setMuted(data.isMuted)
    })
  }

  private gameOver(finalScore: number) {
    sdk.singlePlayer.actions.gameOver({ score: finalScore })
  }
}
```

## Example Multiplayer Implementation

```typescript
import { sdk } from '@farcade/game-sdk'

class Game {
  constructor() {
    // Initialize your game
    this.initialize()

    // Setup event listeners
    this.setupEventListeners()

    // Notify when ready
    sdk.multiplayer.actions.ready()
  }

  private setupEventListeners() {
    // Listen for play again events
    sdk.on('play_again', () => {
      this.resetGame()
    })

    // Listen for mute state changes
    sdk.on('toggle_mute', (data) => {
      this.setMuted(data.isMuted)
    })

    sdk.on('game_info', ({ players, meId }) => {
      this.players = players;
      this.meId = meId;
    })

    sdk.on('game_state_updated', ({ id, data }) => {
      const newGameStateIsValid = this.validateGameState(data);

      if (newGameStateIsValid) {
        this.setGameState(data)
      } else {
        sdk.multiplayer.actions.refuteGameState(id);
      }
    })
  }

  private pushGameStateUpdate(data: Record<string, unknown>, nextTurnPlayerId: string) {
    sdk.multiplayer.actions.updateGameState({
      data,
      alertUserIds: [nextTurnPlayerId],
    })
  }

  private gameOver(scores: { playerId: string, score: number }[]) {
    sdk.multiplayer.actions.gameOver({ scores })
  }
}
```

### Best Practices for Haptic Feedback

- Use haptic feedback sparingly to avoid overwhelming the player
- Reserve haptic feedback for meaningful interactions and achievements
- Consider using it for:
  - Collisions with obstacles
  - Collecting power-ups
  - Completing levels
  - Achieving high scores
  - Important game events

## License

MIT
