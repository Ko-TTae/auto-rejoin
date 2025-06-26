document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('autoJoinToggle');

  // 저장된 설정 불러오기
  chrome.storage.local.get('autoJoinEnabled', (data) => {
    toggle.checked = data.autoJoinEnabled !== false; // 기본값 true
  });

  // 체크박스 변경 시 저장
  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ autoJoinEnabled: toggle.checked });
  });
});
