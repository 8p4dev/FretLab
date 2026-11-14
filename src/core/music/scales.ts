// 스케일 카탈로그 — 공유 계약 §3.3 (에이전트 A 소유). 간격 유효성은 music.check.ts 가 검사한다.
import type { Scale, ScaleGroup } from '../types'

export const SCALE_GROUPS: { id: ScaleGroup; nameKo: string }[] = [
  { id: 'major', nameKo: '메이저' }, { id: 'minor', nameKo: '마이너' }, { id: 'pentatonic', nameKo: '펜타토닉' }, { id: 'blues', nameKo: '블루스' },
  { id: 'modes', nameKo: '모드' }, { id: 'harmonicMinor', nameKo: '하모닉 마이너 모드' }, { id: 'melodicMinor', nameKo: '멜로딕 마이너 모드' },
  { id: 'symmetric', nameKo: '대칭' }, { id: 'bebop', nameKo: '비밥' }, { id: 'world', nameKo: '민속' }, { id: 'other', nameKo: '기타' },
]

const s = (id: string, name: string, nameKo: string, intervals: number[], group: ScaleGroup, aliases?: string[]): Scale =>
  aliases ? { id, name, nameKo, intervals, group, aliases } : { id, name, nameKo, intervals, group }

export const SCALES: Scale[] = [
  // 메이저
  s('major', 'Major (Ionian)', '메이저 (이오니안)', [0, 2, 4, 5, 7, 9, 11], 'major', ['Ionian']),
  s('harmonic-major', 'Harmonic Major', '하모닉 메이저', [0, 2, 4, 5, 7, 8, 11], 'major'),
  // 마이너
  s('natural-minor', 'Natural Minor (Aeolian)', '내추럴 마이너 (에올리안)', [0, 2, 3, 5, 7, 8, 10], 'minor', ['Aeolian']),
  s('harmonic-minor', 'Harmonic Minor', '하모닉 마이너', [0, 2, 3, 5, 7, 8, 11], 'minor'),
  s('melodic-minor', 'Melodic Minor', '멜로딕 마이너', [0, 2, 3, 5, 7, 9, 11], 'minor', ['Jazz Minor']),
  // 펜타토닉
  s('major-pentatonic', 'Major Pentatonic', '메이저 펜타토닉', [0, 2, 4, 7, 9], 'pentatonic'),
  s('minor-pentatonic', 'Minor Pentatonic', '마이너 펜타토닉', [0, 3, 5, 7, 10], 'pentatonic'),
  s('dominant-pentatonic', 'Dominant Pentatonic', '도미넌트 펜타토닉', [0, 2, 4, 7, 10], 'pentatonic'),
  // 블루스
  s('major-blues', 'Major Blues', '메이저 블루스', [0, 2, 3, 4, 7, 9], 'blues'),
  s('minor-blues', 'Minor Blues', '마이너 블루스', [0, 3, 5, 6, 7, 10], 'blues', ['Blues']),
  s('mixo-blues', 'Mixo-Blues', '믹소 블루스', [0, 2, 3, 4, 5, 6, 7, 9, 10], 'blues'),
  // 모드 (메이저 스케일의 7 모드)
  s('ionian', 'Ionian', '이오니안', [0, 2, 4, 5, 7, 9, 11], 'modes', ['Major']),
  s('dorian', 'Dorian', '도리안', [0, 2, 3, 5, 7, 9, 10], 'modes'),
  s('phrygian', 'Phrygian', '프리지안', [0, 1, 3, 5, 7, 8, 10], 'modes'),
  s('lydian', 'Lydian', '리디안', [0, 2, 4, 6, 7, 9, 11], 'modes'),
  s('mixolydian', 'Mixolydian', '믹솔리디안', [0, 2, 4, 5, 7, 9, 10], 'modes', ['Dominant']),
  s('aeolian', 'Aeolian', '에올리안', [0, 2, 3, 5, 7, 8, 10], 'modes', ['Natural Minor']),
  s('locrian', 'Locrian', '로크리안', [0, 1, 3, 5, 6, 8, 10], 'modes'),
  // 하모닉 마이너 모드 (2~7)
  s('locrian-nat6', 'Locrian ♮6', '로크리안 ♮6', [0, 1, 3, 5, 6, 9, 10], 'harmonicMinor'),
  s('ionian-sharp5', 'Ionian #5', '이오니안 #5', [0, 2, 4, 5, 8, 9, 11], 'harmonicMinor', ['Augmented Major']),
  s('dorian-sharp4', 'Dorian #4', '도리안 #4', [0, 2, 3, 6, 7, 9, 10], 'harmonicMinor', ['Romanian Minor', 'Ukrainian Dorian']),
  s('phrygian-dominant', 'Phrygian Dominant', '프리지안 도미넌트', [0, 1, 4, 5, 7, 8, 10], 'harmonicMinor', ['Spanish Gypsy', 'Freygish']),
  s('lydian-sharp2', 'Lydian #2', '리디안 #2', [0, 3, 4, 6, 7, 9, 11], 'harmonicMinor'),
  s('ultralocrian', 'Ultralocrian', '울트라로크리안', [0, 1, 3, 4, 6, 8, 9], 'harmonicMinor', ['Super Locrian bb7']),
  // 멜로딕 마이너 모드 (2~7)
  s('dorian-b2', 'Dorian b2', '도리안 b2', [0, 1, 3, 5, 7, 9, 10], 'melodicMinor', ['Phrygian ♮6']),
  s('lydian-augmented', 'Lydian Augmented', '리디안 어그먼트', [0, 2, 4, 6, 8, 9, 11], 'melodicMinor'),
  s('lydian-dominant', 'Lydian Dominant', '리디안 도미넌트', [0, 2, 4, 6, 7, 9, 10], 'melodicMinor', ['Overtone', 'Acoustic']),
  s('mixolydian-b6', 'Mixolydian b6', '믹솔리디안 b6', [0, 2, 4, 5, 7, 8, 10], 'melodicMinor', ['Hindu']),
  s('locrian-nat2', 'Locrian ♮2', '로크리안 ♮2', [0, 2, 3, 5, 6, 8, 10], 'melodicMinor', ['Half-Diminished']),
  s('altered', 'Altered', '얼터드', [0, 1, 3, 4, 6, 8, 10], 'melodicMinor', ['Super Locrian', 'Diminished Whole Tone']),
  // 대칭
  s('diminished-wh', 'Diminished (Whole-Half)', '디미니시 (온-반)', [0, 2, 3, 5, 6, 8, 9, 11], 'symmetric'),
  s('diminished-hw', 'Diminished (Half-Whole)', '디미니시 (반-온)', [0, 1, 3, 4, 6, 7, 9, 10], 'symmetric', ['Dominant Diminished']),
  s('whole-tone', 'Whole Tone', '홀톤', [0, 2, 4, 6, 8, 10], 'symmetric'),
  s('augmented', 'Augmented', '어그먼트', [0, 3, 4, 7, 8, 11], 'symmetric'),
  s('tritone', 'Tritone', '트라이톤', [0, 1, 4, 6, 7, 10], 'symmetric', ['Petrushka']),
  s('chromatic', 'Chromatic', '크로매틱', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'symmetric'),
  // 비밥
  s('bebop-dominant', 'Bebop Dominant', '비밥 도미넌트', [0, 2, 4, 5, 7, 9, 10, 11], 'bebop'),
  s('bebop-major', 'Bebop Major', '비밥 메이저', [0, 2, 4, 5, 7, 8, 9, 11], 'bebop'),
  s('bebop-minor', 'Bebop Minor', '비밥 마이너', [0, 2, 3, 5, 7, 8, 9, 11], 'bebop', ['Bebop Melodic Minor']),
  s('bebop-dorian', 'Bebop Dorian', '비밥 도리안', [0, 2, 3, 4, 5, 7, 9, 10], 'bebop'),
  // 민속
  s('hungarian-minor', 'Hungarian Minor', '헝가리안 마이너', [0, 2, 3, 6, 7, 8, 11], 'world', ['Gypsy Minor', 'Algerian']),
  s('hungarian-major', 'Hungarian Major', '헝가리안 메이저', [0, 3, 4, 6, 7, 9, 10], 'world'),
  s('gypsy', 'Gypsy', '집시', [0, 2, 3, 6, 7, 8, 10], 'world', ['Hungarian Gypsy']),
  s('double-harmonic', 'Double Harmonic', '더블 하모닉', [0, 1, 4, 5, 7, 8, 11], 'world', ['Byzantine', 'Arabic', 'Bhairav']),
  s('neapolitan-major', 'Neapolitan Major', '네아폴리탄 메이저', [0, 1, 3, 5, 7, 9, 11], 'world'),
  s('neapolitan-minor', 'Neapolitan Minor', '네아폴리탄 마이너', [0, 1, 3, 5, 7, 8, 11], 'world'),
  s('persian', 'Persian', '페르시안', [0, 1, 4, 5, 6, 8, 11], 'world'),
  s('oriental', 'Oriental', '오리엔탈', [0, 1, 4, 5, 6, 9, 10], 'world'),
  s('hirajoshi', 'Hirajoshi', '히라조시', [0, 2, 3, 7, 8], 'world'),
  s('in-sen', 'In Sen', '인센', [0, 1, 5, 7, 10], 'world'),
  s('iwato', 'Iwato', '이와토', [0, 1, 5, 6, 10], 'world'),
  s('kumoi', 'Kumoi', '구모이', [0, 2, 3, 7, 9], 'world'),
  s('yo', 'Yo', '요', [0, 2, 5, 7, 9], 'world', ['Ritusen']),
  s('pelog', 'Pelog', '펠로그', [0, 1, 3, 7, 8], 'world', ['Balinese']),
  s('egyptian', 'Egyptian', '이집션', [0, 2, 5, 7, 10], 'world', ['Suspended Pentatonic']),
  s('chinese', 'Chinese', '중국', [0, 4, 6, 7, 11], 'world'),
  s('spanish-8-tone', 'Spanish 8-Tone', '스패니시 8음', [0, 1, 3, 4, 5, 6, 8, 10], 'world', ['Jewish']),
  s('todi', 'Todi', '토디', [0, 1, 3, 6, 7, 8, 11], 'world'),
  s('marva', 'Marva', '마르바', [0, 1, 4, 6, 7, 9, 11], 'world'),
  s('purvi', 'Purvi', '푸르비', [0, 1, 4, 6, 7, 8, 11], 'world'),
  // 기타
  s('enigmatic', 'Enigmatic', '에니그매틱', [0, 1, 4, 6, 8, 10, 11], 'other'),
  s('prometheus', 'Prometheus', '프로메테우스', [0, 2, 4, 6, 9, 10], 'other'),
  s('major-locrian', 'Major Locrian', '메이저 로크리안', [0, 2, 4, 5, 6, 8, 10], 'other', ['Arabian']),
  s('leading-whole-tone', 'Leading Whole Tone', '리딩 홀톤', [0, 2, 4, 6, 8, 10, 11], 'other'),
  s('lydian-minor', 'Lydian Minor', '리디안 마이너', [0, 2, 4, 6, 7, 8, 10], 'other'),
]

export const scaleById = (id: string): Scale => SCALES.find((x) => x.id === id) ?? SCALES[0]
