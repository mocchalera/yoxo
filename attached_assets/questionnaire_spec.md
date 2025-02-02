# YOXO Fes アンケート仕様書

## 1. アンケート構成

### 疲労源E
```yaml
section1:
  name: 疲労源E
  description: 過去2週間の疲労要因評価
  scale: 1-4
  scoring: (平均値-1) × 25
  questions:
    - item1: 仕事や家事を長時間する必要があった
    - item2: 常に時間に追われている感じだった
    - item3: 締め切りに追われた作業が多かった
    - item4: 難しい問題を解決する必要があった
    - item5: 複数の仕事を同時にこなす必要があった
    - item6: 予定外の仕事が入ることが多かった
```

### 疲労マネジメント行動B
```yaml
section2:
  name: 疲労マネジメント行動B
  description: 疲労への対処行動評価
  scale: 1-4
  scoring: (平均値-1) × 25
  questions:
    - item7: 十分な睡眠時間を確保するようにした
    - item8: バランスの良い食事を心がけた
    - item9: 適度な運動を行うようにした
    - item10: 息抜きの時間を確保するようにした
    - item11: 人と話をして気分転換をした
    - item12: 仕事とプライベートの切り替えを意識した
```

### 疲労感Fs
```yaml
section3:
  name: 疲労感Fs
  description: 主観的疲労感の評価
  scale: 1-4
  scoring: (平均値-1) × 25
  questions:
    - item13: 体が疲れやすい
    - item14: 気力が出ない
    - item15: イライラする
    - item16: 集中力が続かない
```

## 2. 結果分類

### 疲労タイプマトリクス
```yaml
疲労タイプマトリクス:
  軸:
    x: 疲労感
    y: 脳疲労
  レベル区分:
    - 高
    - 中
    - 低
  分類パターン:
    高_高: 限界疲労
    高_中: 拡大疲労
    高_低: 過敏疲労
    中_高: 見過ごし疲労
    中_中: バランス疲労
    中_低: 敏感疲労
    低_高: 盲目疲労
    低_中: 鈍感疲労
    低_低: 軽疲労
```

## 3. 計算指標

### スコア計算式
```yaml
計算指標:
  脳疲労Fp:
    formula: (Ds-50) × 50/30 + 50
    constraints:
      min: 0
      max: 100
  
  疲労レジリエンス:
    formula: 100 × 2E/(2E+Fs+Fp)
    variables:
      E: 疲労源スコア
      Fs: 疲労感スコア
      Fp: 脳疲労スコア
```

## 4. 出力項目

```yaml
出力項目:
  - 疲労タイプ（9マトリクス分類）
  - 脳疲労指数（1-100）
  - 心疲労指数（1-100：アンケートによる疲労指数）
  - 疲労源（1-100：アンケートによる疲労源の指数）
  - 脳疲労レジリエンス
  - パーソナライズされたアドバイス
```
