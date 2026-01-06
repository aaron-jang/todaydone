import { exportData, importData, resetDatabase } from '../lib/db';

export default function Settings() {
  async function handleExport() {
    try {
      const jsonData = await exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-loop-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('데이터를 성공적으로 저장했어요! 📦');
    } catch (error) {
      console.error('Export failed:', error);
      alert('저장에 실패했어요 😢');
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importData(text);
        alert('데이터를 불러왔어요! 페이지를 새로고침할게요 ✨');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('불러오기에 실패했어요. 파일을 확인해주세요 😢');
      }
    };

    input.click();
  }

  async function handleReset() {
    if (!confirm('모든 데이터를 삭제할까요? 되돌릴 수 없어요! ⚠️')) return;

    try {
      await resetDatabase();
      alert('모든 데이터를 삭제했어요. 페이지를 새로고침할게요 🔄');
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('삭제에 실패했어요 😢');
    }
  }

  return (
    <div className="container">
      <h1>⚙️ 설정</h1>

      <div className="settings-section">
        <h2>📱 데이터 관리</h2>

        <div className="settings-buttons">
          <button onClick={handleExport} className="btn-primary">
            💾 데이터 내보내기
          </button>

          <button onClick={handleImport} className="btn-secondary">
            📥 데이터 가져오기
          </button>

          <button onClick={handleReset} className="btn-danger">
            🗑️ 모두 삭제하기
          </button>
        </div>

        <div className="settings-info">
          <p>
            <strong>💾 내보내기:</strong> 모든 데이터를 파일로 저장해요.
          </p>
          <p>
            <strong>📥 가져오기:</strong> 저장한 파일에서 데이터를 불러와요.
          </p>
          <p>
            <strong>🗑️ 삭제하기:</strong> 모든 루틴과 기록을 삭제해요. (되돌릴 수 없어요!)
          </p>
        </div>
      </div>
    </div>
  );
}
