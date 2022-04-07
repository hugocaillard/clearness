---
headers:
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=2592000
---


### Add a bit of Clarity

```clarity
(define-read-only (get-sender-vote) (map-get? votes tx-sender))
```

### Get the sender's vote


./src/storesuseColorVote.tsx
```ts
const getVoteMap = (values?: ValidVote) =>
  new Map(ids.map((id, i) => [id, values ? values[i] : undefined]))


export const useColorVote = create<ColorStore>((set, get) => ({
  vote: getVoteMap(),
  alreadyVoted: false,
  // ...

  async fetchVote() {
    const rawVote = await readOnlyRequest('get-sender-vote')

    const vote = cvToTrueValue(rawVote).map((v) => parseInt(v))
    set({ vote: getVoteMap(voteAsNbs), alreadyVoted: true })
  },
}))
```

