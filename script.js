document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');

    // 検索ボタンがクリックされたときの処理
    searchButton.addEventListener('click', performSearch);

    // Enterキーでも検索を実行
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // 検索を実行する非同期関数
    async function performSearch() {
        const searchTerm = searchInput.value;

        // 入力値のチェック
        if (!searchTerm) {
            resultsDiv.textContent = '検索キーワードを入力してください。';
            return;
        }

        // 検索中の状態を表示
        statusDiv.textContent = '検索中...';
        resultsDiv.innerHTML = '';
        const foundPages = [];
        let pageNum = 1;
        let continueSearching = true;

        while (continueSearching) {
            try {
                const response = await fetch(`prints/p${pageNum}.txt`);

                // response.ok が false の場合 (404 Not Found など) はループを終了
                if (!response.ok) {
                    continueSearching = false;
                    break;
                }

                const textData = await response.text();

                // テキストデータ内に検索キーワードが含まれているかチェック
                if (textData.includes(searchTerm)) {
                    foundPages.push(pageNum);
                }

                pageNum++;

            } catch (error) {
                // ネットワークエラーなどが発生した場合
                console.error('ファイルの取得中にエラーが発生しました:', error);
                statusDiv.textContent = 'エラーが発生しました。';
                continueSearching = false;
            }
        }

        // 検索完了後の結果表示
        statusDiv.textContent = '';
        if (foundPages.length > 0) {
            resultsDiv.innerHTML = `<strong>「${escapeHTML(searchTerm)}」</strong>が見つかったページ: <br>${foundPages.join(', ')} ページ`;
        } else {
            resultsDiv.textContent = `「${escapeHTML(searchTerm)}」はどのページにも見つかりませんでした。`;
        }
    }

    // XSS対策のためのHTMLエスケープ関数
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }
});
