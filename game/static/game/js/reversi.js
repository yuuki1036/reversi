/*
設定読み込み後、盤面を作成し、初期配置に石を置く。
Ajax通信でゲームの状況をサーバーに送信する。
サーバー側で石を置ける位置と置いたときひっくり返る石を計算し、こちらに送信する。
受信データをもとにクリックイベントを設定する。
イベントトリガー後はDOMを操作して石を置いてひっくり返す。
更新されたゲーム状況をサーバーに送信する。
以下を盤面が埋まるまで繰り返す。
 */





//ゲーム設定を定義する
const mode = $('#mode').text();//対戦モード
const hint = $('#hint').text();//ヒントモード
let color = $('#color').text();//現在の色
let turn = $('#turn').text();//現在のターン
let rev_color;//colorの反対色
let you_color, opp_color;


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
if(color == 'black'){
    rev_color = 'white'
}else{
    rev_color = 'black'
}



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
DisplaySetup(['33', '44'], color);
DisplaySetup(['34', '43'], rev_color);


function DisplaySetup(put_list,color){
    /*
    初期設定時の石の表示
    put_list: 石を置く番地の配列
    color: 置く石の色
     */
	for(let i=0; i<put_list.length; i++){
		PutAndReverse(put_list, color, i)
	}
}

function PutAndReverse(put_list, color, i){
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
    }
}
//初期設定終了



//JSONデータ定義
let json_data = {
	mode: mode,
	status: 'initialize',
	board: board,
	puttable: null,
	color: color,
	turn: turn,
	hint: hint,
    select: null,
    result: null,
    testmode: false,
    count: 4,
};


$('#auto').on('click', function(){
    if(json_data.testmode){
        json_data.testmode = false;
        $(this).text("オートモードOFF")
    }else{
        json_data.testmode = true;
        $(this).text("オートモードON")
    }
});

let turn_msg = '',
    color_msg = '';

function ChangeMsg(json_data){
    if(json_data.turn == 'you'){
        turn_msg = "あなた"
    }else{
        turn_msg = "相手"
    }
    if(json_data.color == 'black'){
        color_msg = "黑"
    }else{
        color_msg = "白"
    }
}

function DisplayMsg(msg){
    $('#log').fadeOut(100,function(){
        $('#log').text(msg).fadeIn(100)
    })
}

let TURN_MSG;
ChangeMsg(json_data);
if(json_data.turn == 'you'){
    TURN_MSG = turn_msg + "の番です "+ you_color;
}else{
    TURN_MSG = turn_msg + "の番です "+ opp_color;
}

DisplayMsg(TURN_MSG);


function AjaxExecution(){
    AjaxSend(json_data).done(function(result){
	AjaxRecieve(result);
    });
}

AjaxExecution();


function AjaxSend(json_data){
	return $.ajax({
		'url': "posts/",
		'type': 'POST',
		'data': JSON.stringify(json_data),
		'dataType': 'json',
	});
}

function AjaxRecieve(result){
	json_data = result;
    if(json_data.status == 'end'){
        GameSet(json_data);
        return
    }
	$('.block').removeClass("able");


    if( hint == "True" ){
        $('.block').css('background-color', 'inherit')
    }
    for(let i=0; i<json_data.puttable.length; i++){
        let this_block = $('.block').filter('#' + json_data.puttable[i][0]);
        this_block.addClass("able");
        if (hint == "True" && json_data.turn == 'you') {
            this_block.css('background-color', '#608030');
        }
    }

    if(json_data.select){
        setTimeout(function () {

            PutStone();
            $('.block').filter('#' + json_data.select).click();
        },0);
    }else{
        PutStone();
        if(json_data.testmode && json_data.puttable){
            $('.block').filter('#' + json_data.puttable[0][0]).click();
        }
    }


}




function PutStone(){
	let puttable = json_data.puttable;
	let color = json_data.color;
	let put_list;
	let put_first;
    if(json_data.status == 'pass'){
        let PASS_MSG = "置ける場所がありません。" + turn_msg + "はパスになります。";
        DisplayMsg(PASS_MSG);
        setTimeout(function () {
            json_data.status = 'pass_reach'
            json_data = JsonDataUpdate(json_data);
            AjaxExecution();
        },2000);

    }else {
        $('.area').on('click', '.able', function () {
            $('.area').off('click', '.able');
            let idx = $(this).attr('id');
            for (let i = 0; i < puttable.length; i++) {
                if (idx == puttable[i][0]) {
                    put_list = puttable[i];
                    put_first = [put_list[0]];
                    put_list.shift();
                    break;
                }
            }
            PutAndReverse(put_first, color, 0);
            json_data.count += 1;
            AsyncProcess(put_list, color).then((v) => {
                json_data = JsonDataUpdate(json_data);
                AjaxExecution();
            });
        });
    }
}

function JsonDataUpdate(d){
	d.board = board;
	d.puttable = null;

	if(d.color == 'black'){
		d.color = 'white'
	}else{
		d.color = 'black'
	}

	if( d.turn == 'you' ){
		d.turn = 'opp'
	}else{
		d.turn = 'you'
        d.select = null;
	}
	DisplayChange(d);
	return d;
}

function DisplayChange(d){
    let $turn = $('#turn_display');
    let $color = $('#color_display');
    if(d.turn == 'you'){
        $turn.text("あなた");
    }else{
        $turn.text("相手");
    }
    if(d.color == 'black'){
        $color.text("くろ");
    }else{
        $color.text("しろ");
    }
    ChangeMsg(d);
    if(d.turn == 'you'){
    TURN_MSG = turn_msg + "の番です "+ you_color;
}else{
    TURN_MSG = turn_msg + "の番です "+ opp_color;
}
    DisplayMsg(TURN_MSG);
}

async function AsyncProcess(put_list,color){
    for(let i=0; i<put_list.length; i++){
        const result = await Resolve(i);

        let $this_block = $('.block').filter('#' + put_list[i]);
        let $this_circle = $this_block.find('.circle');
        let idx = put_list[i].split('');
        $this_block.addClass('put');

        if(color == 'white'){
            board[ Number(idx[0]) ][ Number(idx[1]) ] = 'W';
            $this_circle.animate({
                backgroundColor: '#ffffff',
                borderColor: '1px solid #000000',
            },0);
        }else {
            board[Number(idx[0])][Number(idx[1])] = 'B';
            $this_circle.animate({
                backgroundColor: '#000000',
                borderColor: '1px solid #008000',
            },0);
        }
    }
}

function Resolve(i) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(i);
        }, 0);
    })
}

function GameSet(json_data){
    JsonDataUpdate(json_data);
    let RESULT_MSG;
    if(json_data.result[2] == you_color){
        RESULT_MSG = "あなた" + "の勝ちです";
    }else{
        RESULT_MSG = "相手" + "の勝ちです";
    }
    DisplayMsg(RESULT_MSG);
    setTimeout(function(){
        $.post({
		'url': "result/",
		'type': 'POST',
		'data': JSON.stringify(json_data),
		'dataType': 'json',
	});
    },3000);
}
