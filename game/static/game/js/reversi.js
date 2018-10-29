/*
設定読み込み後、盤面を作成し、初期配置に石を置く。
Ajax通信でゲームの状況をサーバーに送信する。
サーバー側で石を置ける位置と置いたときひっくり返る石を計算し、こちらに送信する。
受信データをもとにクリックイベントを設定する。
イベントトリガー後はDOMを操作して石を置いてひっくり返す。
更新されたゲーム状況をサーバーに送信する。
以下を盤面が埋まるまで繰り返す。
 */

//デュレーションタイム設定
let reverse_time = 200;//石がひっくり返る時間
let pass_time = 4000;//パス時の停止時間
let com_time = 1000;//COMの停止時間
let gameset_time =3000;//ゲーム修了時の停止時間

let time = {
    'reverse_time': reverse_time,
    'pass_time': pass_time,
    'com_time': com_time,
    'gameset_time': gameset_time,
};

//ゲーム設定をHTMLから読み取る
const mode = $('#mode').text();//対戦モード
const strength = $('#strength').text();//COMの強さ
const hint = $('#hint').text();//ヒントモード
let color = $('#color').text();//現在の色
let turn = $('#turn').text();//現在のターン
let you_name = $('#you_name').text();//ユーザー名
let opp_name;//相手の名前
let rev_color;//colorの反対色
let you_color, opp_color;//自分の色、相手の色

//相手の名前を定義する
if(mode == 'computer'){
    if(strength == '1'){
        opp_name = "よわ太郎"
    }else if(strength == '2'){
        opp_name = "ふつう市民"
    }else{
        opp_name = 'つよ男爵'
    }
}else{
    opp_name = '相手'
}

//自分と相手の色を定義する
if(turn == 'opp'){
    if(color == 'black'){
        color = 'white';
        you_color = "black";
        opp_color = 'white';
    }else{
        color = 'black';
        you_color = 'white';
        opp_color = 'black';
    }
}else{
    if(color == 'black'){
        you_color = 'black';
        opp_color = 'white';
    }else {
        you_color = 'white';
        opp_color = 'black';
    }
}

//rev_colorを定義する
rev_color = (color == 'black')? 'white': 'black';


//盤面を作成する
let $block = $('.block');//クリック要素になるマス目(div)
let board = new Array(8);//盤面の状態を表す二次元配列

//マス目を64個複製し、HTMLに追加する。
for(let i=0; i<8; i++){
	board[i] = new Array(8).fill("*");//ついでに配列も作成。
	for(let j=0; j<8; j++){
		let $clone = $block.clone();
		$clone.attr('id', '' + i + j)//番地を表すIDを設定
			.css({'border': '1px solid black'});//マス目の枠線
		if(i == 0){　//位置による枠線の違い
			$clone.css({'border-top': '2px solid black'});
		}
		if(i == 7){
			$clone.css({'border-bottom': '2px solid black'});
		}
		if(j == 0){
			$clone.css({'border-left': '2px solid black'});
		}
		if(j == 7){
			$clone.css({'border-right': '2px solid black'});
		}
		$('.area').append($clone);//HTMLに追加
	}
}
$('.block:first').remove();//クローン元は削除する

//石を初期配置に置く
displaySetup(['33', '44'], color);
displaySetup(['34', '43'], rev_color);


function displaySetup(put_list,color){
	for(let i=0; i<put_list.length; i++){
		put(put_list, color, i)
	}
}

//アニメーション無しで石を置く
function put(put_list, color, i){
    let $this_block = $('.block').filter('#' + put_list[i]);
    let $this_circle = $this_block.find('.circle');//blockの子要素circle

    $this_circle.css('background-color', color);
    let idx = put_list[i].split('');

    if(color == 'white'){ //色ごとの処理
        board[ Number(idx[0]) ][ Number(idx[1]) ] = 'W';
        $this_circle.css('border', '1px solid black');
    }else {
        board[Number(idx[0])][Number(idx[1])] = 'B';
        $this_circle.css('border', '1px solid black');
    }
}
//初期設定終了


/*
JSONデータを作成、各種設定後 ajaxでサーバーに送る
 */

//JSONデータ定義
let d = {
	'mode': mode,//対戦モード
    'strength': strength,//対COM時の強さ
	'status': 'initialize',//ゲームの状況
	'board': board,//盤面を表すの配列
	'puttable': null,//石を置ける番地リスト
	'color': color,//現在のターンの色
    'you_name':you_name,
    'opp_name': opp_name,
    'you_color': you_color,
    'opp_color': opp_color,
	'turn': turn,//現在のターン
	'hint': hint,// ヒントモードのON OFF
    'select': null,//COMが選択した番地
    'score': 0,//スコア
    'testmode': false,//テストモードのON OFF
};

//VS COM時のスコア加算
if(mode == 'computer'){
    if(hint == 'False'){
        d.score += 3000;
    }
    if(strength == '2'){
        d.score += 5000;
    }else if(strength == '3'){
        d.score += 8000;
    }
}

//テストモードボタンのイベント設定
$('#auto').on('click', function(){
    if(d.testmode){
        d.testmode = false;
        $(this).text("OFF")
    }else{
        d.testmode = true;
        $(this).text("ON")
    }
});

//HTML表示用
let color_msg;//黒 or 白
let PASS_MSG;//パス時のログメッセージ
let TURN_MSG;//ターンのログメッセージ

//HTML上のログメッセージの表示
function displayMsg(msg){
    $('#log').fadeOut(100,function(){
        $('#log').text(msg).fadeIn(100)
    })
}

//ターンのログメッセージ作成
color_msg = (d.color == 'black')? "黒": "白";
TURN_MSG = (d.turn == 'you')?
        `${color_msg} ${d.you_name}の番です`:
        `${color_msg} ${d.opp_name}の番です`;
displayMsg(TURN_MSG);

//ajaxを送信して受信する関数
function ajaxExecution(){
    ajaxSend(d).done(function(recieve){
	ajaxRecieve(recieve);
    });
}

ajaxExecution();//ajax初回送信

//JSONデータを送信する
function ajaxSend(){
	return $.ajax({
		'url': "posts/",
		'type': 'POST',
		'data': JSON.stringify(d),
		'dataType': 'json',
	});
}

//JSONデータ受信後
function ajaxRecieve(recieve){
    /*
    状況に応じて設定を変更する
     */
	d = recieve;//JSONデータ更新
    if(d.status == 'end'){ //ゲーム終了時
        gameSet();
        return
    }
    if( hint == "True" ){ //ヒントモードON時
        $('.block').css('background-color', 'inherit');// ヒントカラー初期化
    }
    $('.block').removeClass("able");//設置可能番地クラス初期化
    //puttableの格配列の先頭は設置可能番地を表すのでableクラスを付与する
    for(let i=0; i<d.puttable.length; i++){
        let this_block = $('.block').filter('#' + d.puttable[i][0]);
        this_block.addClass("able");
        if (hint == "True" && d.turn == 'you') { //ヒントカラーにする
            this_block.css('background-color', '#608030');
        }
    }
    //テストモード時のデュレーションタイム切り替え
    if(d.testmode){
        time.reverse_time = 0;
        time.pass_time = 0;
        time.com_time = 0;
        time.gameset_time = 0;
    }else{
        time.reverse_time = reverse_time;
        time.pass_time = pass_time;
        time.com_time = com_time;
        time.gameset_time = gameset_time;
    }
    //クリックイベントを設定する
    if(d.select){ //VS COM時かつターンがCOM
        setTimeout(function () { //COMターン時のデュレーション
            putStone();
            $('.block').filter('#' + d.select).click();
        },time.com_time);
    }else{
        putStone();
        if(d.testmode){
            $('.block').filter('#' + d.puttable[0][0]).click();
        }
    }
}

//設置可能番地にクリックイベントを設定する
function putStone(){
	let put_list;//ひっくり返る番地
	let put_first;//置く番地
	let idx;

    if(d.status == 'pass'){ //パス時の処理
        PASS_MSG = (d.turn == 'you')?
            `${color_msg} ${d.you_name}はパスします`:
            `${color_msg} ${d.opp_name}はパスします`;
        displayMsg(PASS_MSG);
        setTimeout(function () {
            d.status = 'pass_reach';//２連続パスはゲーム終了なのでリーチ
            d = jsonDataUpdate(d);
            ajaxExecution();
            return
        },time.pass_time);
    }else {
        $('.area').on('click', '.able', function(){
            $('.area').off('click', '.able');//クリックイベント初期化
            idx = $(this).attr('id');
            //番地とputtableを照合する
            for(let i = 0; i < d.puttable.length; i++){
                if (idx == d.puttable[i][0]) {
                    put_list = d.puttable[i];
                    put_first = [put_list[0]];//置く番地
                    put_list.shift();//ひっくり返る番地リスト
                    break;
                }
            }
            if(d.turn == 'you'){ //ひっくり返った数でスコア加算
                d.score += 2**(put_list.length+1);
            }
            put(put_first, d.color, 0);//石を置く
            //非同期処理（一つずつ石をひっくり返す）
            asyncReverse(put_list).then((v) => {
                d = jsonDataUpdate();//データ更新
                //以後 送信=>受信=>イベント設定=>送信を繰り返す
                ajaxExecution();
            });
        });
    }
}

//非同期処理 関数putとほぼ同じ
async function asyncReverse(put_list){
    for(let i=0; i<put_list.length; i++){
        const result = await resolve(i);//応答があるまで停止

        let $this_block = $('.block').filter('#' + put_list[i]);
        let $this_circle = $this_block.find('.circle');
        let idx = put_list[i].split('');
        if(d.color == 'white'){
            board[ Number(idx[0]) ][ Number(idx[1]) ] = 'W';
            $this_circle.animate({
                backgroundColor: '#ffffff',
                borderColor: '1px solid #000000',
            }, time.reverse_time);
        }else {
            board[ Number(idx[0]) ][ Number(idx[1]) ] = 'B';
            $this_circle.animate({
                backgroundColor: '#000',
                borderColor: '1px solid #000000',
            }, time.reverse_time);
        }
    }
}
function resolve(i) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(i);
        }, time.reverse_time);
    })
}

//描画終了後のJSONデータ更新
function jsonDataUpdate(){
    d.board = board;
	d.puttable = null;
	d.color = (d.color=='black')? 'white': 'black';
	if(d.turn == 'you'){
		d.turn = 'opp'
	}else{
		d.turn = 'you';
        d.select = null;
	}
	color_msg = (d.color == 'black')? "黒": "白";
    TURN_MSG = (d.turn == 'you')?
            `${color_msg} ${d.you_name}の番です`:
            `${color_msg} ${d.opp_name}の番です`;
    displayMsg(TURN_MSG);
	return d;//更新したJSONデータを返す
}

//ゲーム終了時に実行
function gameSet(){
    $('.block').css('background-color', 'inherit');
    displayMsg("ゲームセット！");
    $.ajax({ //結果を送信
		'url': "result/",
		'type': 'POST',
		'data': JSON.stringify(d),
		'dataType': 'json',
	}).done(function(recieve){
	    displayResult(recieve)
    });
    setTimeout(function(){
        $('#result').click();//RESULT画面表示
    },time.gameset_time);
}
//RESULT画面に結果を反映
function displayResult(recieve){
    d = recieve;
    if(d.win_or_lose == 'win'){
        $('#winner-name').text(`${d.you_name}の勝ち!`);
        $('#which').text("あなたの勝ちです");
    }else if(d.win_or_lose == 'lose'){
        $('#winner-name').text(`${d.opp_name}の勝ち!`);
        $('#which').text("あなたの負けです");
    }else{
        $('#winner-name').text(`引き分け!`);
        $('#which').hide();
    }
    $('#game-result').text(`黒 ${d.cnt_b} - 白 ${d.cnt_w}`);
    $('#game-score').text(`スコア ${d.score}`);
}
