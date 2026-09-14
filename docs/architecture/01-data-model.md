# Data Model

```ts
type Session = {
  teamAlias: string;
  gradeBand: '5'|'6'|'7'|'8';
  scenario?: string;
  initialDesign?: DesignSnapshot;
  finalDesign?: DesignSnapshot;
  reflection?: string;
}

type Design = {
  placedItems: PlacedItem[];
  budgetUsed: number;
  areaMetrics: Record<string, number>;
  scores: ScoreSet;
}

type PlacedItem = {
  id: string;
  type: ComponentType;
  x: number; y: number;
  width: number; height: number;
}

type AIReview = { questions: string[]; responses: string[] }
```

Schema sprintte ihtiyaç oldukça genişletilir; gereksiz erken genelleme yapılmaz.