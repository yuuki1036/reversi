/*
設定読み込み後、盤面を作成し、初期配置に石を置く。
Ajax通信でゲームの状況をサーバーに送信する。
サーバー側で石を置ける位置と置いたときひっくり返る石を計算し、こちらに送信する。
受信データをもとにクリックイベントを設定する。
イベントトリガー後はDOMを操作して石を置いてひっくり返す。
更新されたゲーム状況をサーバーに送信する。
以下を盤面が埋まるまで繰り返す。
 */

time = {
    'reverse_time': 200,
    'pass_time': 4000,
    'com_time': 2500,
}



//ゲーム設定を定義する
const mode = $('#mode').text();//対戦モード
const strength = $('#strength').text();//COMの強さ
const hint = $('#hint').text();//ヒントモード
let color = $('#color').text();//現在の色
let turn = $('#turn').text();//現在のターン
let you_name = $('#you_name').text();
let opp_name;
let rev_color;//colorの反対色
let you_color, opp_color;

if(mode == 'computer'){
    if(strength == '1'){
        opp_name = "よわ太郎"
    }else if(strength == '2'){
        opp_name = "ふつう市民"
    }else{
        opp_name = 'つよ男爵'
    }
}else{
    opp_name = '2player'
}



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
let board = new Array(8);//盤面の状態を表す配列

//マス目を64個複製し、HTMLに追加する。
for(let i=0; i<8; i++){
	board[i] = new Array(8).fill("*");//ついでに配列も作成。
	for(let j=0; j<8; j++){
		let $clone = $block.clone();
		$clone.attr('id', '' + i + j)//番地を表すIDを設定
			.css({'border': '1px solid black'});//マス目の枠線
        //位置による枠線の違い
		if(i == 0){
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
    /*
    初期設定時の石の表示
    put_list: 石を置く番地の配列
    color: 置く石の色
     */
	for(let i=0; i<put_list.length; i++){
		putAndReverse(put_list, color, i)
	}
}

function putAndReverse(put_list, color, i){
    let $this_block = $('.block').filter('#' + put_list[i]);
    let $this_circle = $this_block.find('.circle');

    $this_block.addClass('put');
    $this_circle.css('background-color', color);
    let idx = put_list[i].split('');

    if(color == 'white'){
        board[ Number(idx[0]) ][ Number(idx[1]) ] = 'W';
        $this_circle.css('border', '1px solid black');
    }else {
        board[Number(idx[0])][Number(idx[1])] = 'B';
        $this_circle.css('border', '1px solid green');
    }
}
//初期設定終了



//JSONデータ定義
let d = {
	'mode': mode,
    'strength': strength,
	'status': 'initialize',
	'board': board,
	'puttable': null,
	'color': color,
    'you_name':you_name,
    'opp_name': opp_name,
    'you_color': you_color,
    'opp_color': opp_color,
	'turn': turn,
	'hint': hint,
    'select': null,
    'result': null,
    'testmode': false,
    'score': 0,
};

if(mode == 'computer'){
    if(hint == 'False'){
        d.score += 1000
    }
}


$('#auto').on('click', function(){
    if(d.testmode){
        d.testmode = false;
        $(this).text("OFF")
    }else{
        d.testmode = true;
        $(this).text("ON")
    }
});

let turn_msg;
let color_msg;
let PASS_MSG;
let TURN_MSG;


function displayMsg(msg){
    $('#log').fadeOut(100,function(){
        $('#log').text(msg).fadeIn(100)
    })
}


color_msg = (d.color == 'black')? "黒": "白";
TURN_MSG = (d.turn == 'you')?
        `${color_msg} ${d.you_name}の番です`:
        `${color_msg} ${d.opp_name}の番です`;
displayMsg(TURN_MSG);


function ajaxExecution(){
    ajaxSend(d).done(function(recieve){
	ajaxRecieve(recieve);
    });
}

ajaxExecution();


function ajaxSend(){
	return $.ajax({
		'url': "posts/",
		'type': 'POST',
		'data': JSON.stringify(d),
		'dataType': 'json',
	});
}

function ajaxRecieve(recieve){
	d = recieve;
    if(d.status == 'end'){
        gameSet();
        return
    }
	$('.block').removeClass("able");


    if( hint == "True" ){
        $('.block').css('background-color', 'inherit');
    }
    for(let i=0; i<d.puttable.length; i++){
        let this_block = $('.block').filter('#' + d.puttable[i][0]);
        this_block.addClass("able");
        if (hint == "True" && d.turn == 'you') {
            this_block.css('background-color', '#608030');
        }
    }

    if(d.select){
        setTimeout(function () {
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




function putStone(){
	let put_list;
	let put_first;
	let idx;
    if(d.status == 'pass'){
        PASS_MSG = `置ける場所がありません。${turn_msg}はパスになります。`;
        displayMsg(PASS_MSG);
        setTimeout(function () {
            d.status = 'pass_reach'
            d = jsonDataUpdate(d);
            ajaxExecution();
        },time.pass_time);

    }else {
        $('.area').on('click', '.able', function () {
            $('.area').off('click', '.able');
            idx = $(this).attr('id');
            for (let i = 0; i < d.puttable.length; i++) {
                if (idx == d.puttable[i][0]) {
                    put_list = d.puttable[i];
                    put_first = [put_list[0]];
                    put_list.shift();
                    break;
                }
            }
            if(d.turn == 'you'){
                d.score += 2**(put_list.length+1);
            }


            putAndReverse(put_first, d.color, 0);
            asyncProcess(put_list).then((v) => {
                d = jsonDataUpdate();
                ajaxExecution();
            });
        });
    }
}

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
	return d;
}

async function asyncProcess(put_list){
    for(let i=0; i<put_list.length; i++){
        const result = await resolve(i);

        let $this_block = $('.block').filter('#' + put_list[i]);
        let $this_circle = $this_block.find('.circle');
        let idx = put_list[i].split('');
        $this_block.addClass('put');

        if(d.color == 'white'){
            board[ Number(idx[0]) ][ Number(idx[1]) ] = 'W';
            $this_circle.animate({
                backgroundColor: '#ffffff',
                borderColor: '1px solid #000000',
            },time.reverse_time);
        }else {
            board[Number(idx[0])][Number(idx[1])] = 'B';
            $this_circle.animate({
                backgroundColor: '#000',
                borderColor: '1px solid #008000',
            },time.reverse_time);
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

function gameSet(){
    $('.block').css('background-color', 'inherit');
    displayMsg("ゲームセット！");
    $.ajax({
		'url': "result/",
		'type': 'POST',
		'data': JSON.stringify(d),
		'dataType': 'json',
	}).done(function(recieve){
	    displayResult(recieve)
    });
    setTimeout(function(){
        $('#result').click();
    },1000);
}

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
        $('#which').hidden();
    }
    $('#game-result').text(`黒 ${d.cnt_b} - 白 ${d.cnt_w}`);
    $('#game-score').text(`スコア ${d.score}`);
}
