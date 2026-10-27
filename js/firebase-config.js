// ① Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) 에서 복사한 값을 그대로 붙여 넣으세요.
//    apiKey가 비어 있으면 '체험 모드'로 열려요. (이 기기에만 저장, 공유 안 됨)
export const firebaseConfig = {
  apiKey: "AIzaSyAPmsABP9t8oq6rTiioGR-wrWEGhTHBidQ",
  authDomain: "hhgitae-fridge.firebaseapp.com",
  projectId: "hhgitae-fridge",
  storageBucket: "hhgitae-fridge.firebasestorage.app",
  messagingSenderId: "1004282581477",
  appId: "1:1004282581477:web:5ee2d75d7068fa0d959f0c"
};

// ② 우리 가족 구글 계정. 여기 적힌 이메일로 로그인하면 이름이 자동으로 붙어요.
//    Firebase 보안 규칙(firestore.rules)에도 같은 이메일을 적어야 들어올 수 있어요.
export const FAMILY = {
  "padosorinmyheart@gmail.com": "해리",
  "kimhg1481@gmail.com": "홍교"
};
