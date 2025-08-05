document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');

    // ★★★ 変更点 ★★★
    // 一度にリクエストを試みるページの最大数を設定します。
    // printsフォルダ内のファイルがこれを超える場合は、この数値を増やしてください。
    const MAX_PAGES_TO_CHECK = 500; 

    // 検索ボタンがクリックされたときの処理
    searchButton.addEventListener('click', performParallelSearch);

    // Enterキーでも検索を実行
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performParallelSearch();
        }
    });

    // ★★★ 高速化された並列検索を実行する非同期関数 ★★★
    async function performParallelSearch() {
        const searchTerm = searchInput.value;

        if (!searchTerm) {
            resultsDiv.textContent = '検索キーワードを入力してください。';
            return;
        }

        statusDiv.textContent = '検索中...';
        resultsDiv.innerHTML = '';

        // 1. 全ページのフェッチ処理をプロミスとして配列に格納
        const fetchPromises = [];
        for (let i = 1; i <= MAX_PAGES_TO_CHECK; i++) {
            // fetchはすぐに実行され、その結果を待つ「プロミス」が配列に追加される
            fetchPromises.push(fetch(`prints/p${i}.txt`));
        }

        try {
            // 2. Promise.allSettledですべてのフェッチ処理が完了するのを待つ
            // これにより、リクエストが並列で実行される
            const responses = await Promise.allSettled(fetchPromises);
            
            const foundPages = [];
            const textPromises = [];
            const pageNumbers = [];

            // 3. 成功したレスポンスからテキストを抽出する
            responses.forEach((result, index) => {
                // 'fulfilled'はリクエストが成功したという意味 (404 Not Foundも含む)
                if (result.status === 'fulfilled' && result.value.ok) {
                    // result.value.ok はステータスコードが200番台であるかを確認
                    textPromises.push(result.value.text()); // テキスト取得も非同期なのでプロミス
                    pageNumbers.push(index + 1); // 該当するページ番号を保持
                }
            });

            const texts = await Promise.all(textPromises);

            // 4. 抽出した全テキストに対して一気に検索をかける
            texts.forEach((text, index) => {
                if (text.includes(searchTerm)) {
                    foundPages.push(pageNumbers[index]); // 保持していたページ番号を追加
                }
            });

            // 5. 検索完了後の結果表示
            statusDiv.textContent = '';
            if (foundPages.length > 0) {
                // ページ番号を昇順にソートして表示
                foundPages.sort((a, b) => a - b);
                resultsDiv.innerHTML = `<strong>「${escapeHTML(searchTerm)}」</strong>が見つかったページ: <br>${foundPages.join(', ')} ページ`;
            } else {
                resultsDiv.textContent = `「${escapeHTML(searchTerm)}」はどのページにも見つかりませんでした。`;
            }

        } catch (error) {
            console.error('検索処理中にエラーが発生しました:', error);
            statusDiv.textContent = 'エラーが発生しました。コンソールを確認してください。';
        }
    }

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
