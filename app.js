// 厳格なエラーチェックを行う
"use strict";

// APIの接続先
const NYTBaseUrl = 'https://api.nytimes.com/svc/topstories/v2/';
// config.jsから取得されるキー
const ApiKey = config.KEY;
// 閲覧したいニュースのセクション
const SECTIONS = "home, arts, automobiles, books, business, fashion, food, health, insider,\ " +
  "magazine, movies, national, nyregion, obituaries, opinion, politics, realestate, science, sports,\ " +
  "sundayreview, technology, theater, tmagazine, travel, upshot, world";

/**
 * API接続用のURLを作成
 *
 * @param {string} url セレクトボックスで選択したセクション名
 * @returns {string} API接続用のURL
 */
function buildUrl(url) {
  return NYTBaseUrl + url + '.json?api-key=' + ApiKey;
}

/**
 * news-listコンポーネント
 *
 * 他での再利用を考慮しグローバルコンポーネントとして作成
 * ニュースの概要とサムネイル画像を表示
 */
Vue.component('news-list', {
  props: ['results'], // 親スコープからコンポーネントに渡したいデータの配列
  // ニュースリストのためのマークアップ
  // <section>で囲むのはルートエレメントを一つにするというルールがあるため
  // <section>を取り払って実行するとエラーになる。
  // "- Cannot use v-for on stateful component root element because it renders multiple elements."
  template: `
    <section>
      <div class="row" v-for="posts in processedPosts">
        <div class="columns large-3 medium-6" v-for="post in posts">
          <div class="card">
            <div class="card-divider">
            {{ post.title }}
            </div>
            <a :href="post.url" target="_blank"><img :src="post.image_url"></a>
            <div class="card-section">
              <p>{{ post.abstract }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  // 算出プロパティ。メソッドに似ているが結果がキャッシュされる。
  // 値が変わるとその値に依存しているすべてのバインディングが更新される。
  // methodsとの違いは依存するものが更新されたときだけ再評価されるところ。
  computed: {
    processedPosts() {
      let posts = this.results;

      // APIのレスポンスにマップをかけてsuperJumboサイズの画像があるか確かめる
      // あれば画像表示、なければN/Aをサムネイルとして出力する
      posts.map(post => {
        let imgObj = post.multimedia.find(media => media.format === "superJumbo");
        post.image_url = imgObj ? imgObj.url : "http://placehold.it/300x200?text=N/A";
      });

      // ニュースは1行につき4つまで
      let i, j, chunkedArray = [], chunk = 4;
      for (i = 0, j = 0; i < posts.length; i += chunk, j++) {
        chunkedArray[j] = posts.slice(i, i + chunk);
      }
      return chunkedArray;
    }
  }
});


const vm = new Vue({
  el: '#app', // id属性、もしくはユニークなクラスを指定すること
  data: { // el で指定した範囲内で利用できるデータ
    results: [],
    sections: SECTIONS.split(', '), // セクションをカンマ区切りで分割して配列にしている
    section: 'home',
    loading: true, // 初期表示はローディングアニメーションが動いている
    title: ''
  },
  mounted() { // インスタンスのライフサイクルのフックの一つ。DOM操作が必要なときに使う
    this.getPosts('home');
  },
  methods: { // その名のとおりメソッド
    getPosts(section) {
      let url = buildUrl(section);
      // Axiosを使ってAPIにアクセス
      axios.get(url).then((response) => {
        this.loading = false; // ローディング判定をOFFに
        this.results = response.data.results;
        // デフォルトのセクションである'home'以外は見出し（title）が少し変わる
        let title = this.section !== 'home' ? "Top stories in '" + this.section + "' today" : "Top stories today";
        this.title = title + "(" + response.data.num_results + ")";
      }).catch(error => {
        // エラーは逃さずコンソールに吐き出す
        console.log(error);
      });
    }
  }
});

