
const mode = $('#mode').text();
const hint = $('#hint').text();
let color = $('#color').text();
let turn = $('#turn').text();
let rev_color;
console.log(mode,hint,color,turn)

if(color == 'black'){
    rev_color = 'white'
}else{
    rev_color = 'black'
}



/*
ボードを作成する。
divを複製してマス目を作る。
 */

let $area = $('.area');　//ボード全体
let $block = $('.block');		 //マス目
let board = new Array(8);



for(let i=0; i<8; i++){
	board[i] = new Array(8).fill("*");
	for(let j=0; j<8; j++){
		let $clone = $block.clone()
		$clone.attr('id', '' + i + j)
			.css({'border': '1px solid black'});
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
		$area.append($clone);
	}
}
$('.block:first').remove();


function DisplaySetup(put_list,color){
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

DisplaySetup(['33', '44'], color);
DisplaySetup(['34', '43'], rev_color);



// CSRFトークンをAJAXポストデータに含める from django documentation
function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		let cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			let cookie = jQuery.trim(cookies[i]);
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

let csrftoken = getCookie('csrftoken');


function csrfSafeMethod(method) {
	// these HTTP methods do not require CSRF protection
	return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
	beforeSend: function(xhr, settings) {
		if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
			xhr.setRequestHeader("X-CSRFToken", csrftoken);
		}
	}
});

//JSONデータ定義
let json_data = {
	mode: mode,
	status: 'initialize',
	board: board,
	puttable: [],
	color: color,
	turn: turn,
	hint: hint,
    select: null,
};

console.log("init json_data")
console.log(json_data)

AjaxSend(json_data).done(function(result){
	AjaxRecieve(result);
});

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
	console.log("recieve json_data")
	console.log(json_data)

	$('.block').removeClass("able");


    if( hint == "True" ){
        $('.block').css('background-color', 'inherit')
    }
    for(let i=0; i<json_data.puttable.length; i++){
        let this_block = $('.block').filter('#' + json_data.puttable[i][0]);
        this_block.addClass("able");
        if (hint == "True") {
            this_block.css('background-color', '#608030');
        }
    }

    if(json_data.select){
        setTimeout(function () {
            PutStone();
            $('.block').filter('#' + json_data.select).click();
        },3000);
    }else{
        PutStone();
    }
}



function PutStone(){
	let puttable = json_data.puttable;
	let color = json_data.color;
	let put_list;
	let put_first;
    console.log(puttable);
	$('.area').on('click','.able',function(){
        $('.area').off('click','.able');
        let idx = $(this).attr('id');
        for( let i=0; i<puttable.length; i++){
            if( idx == puttable[i][0] ){
                put_list = puttable[i];
                put_first = [put_list[0]];
                put_list.shift();
                break;
            }
        }
        PutAndReverse(put_first, color, 0);
        AsyncProcess(put_list, color).then((v) => {
            json_data = JsonDataUpdate(json_data);
            AjaxSend(json_data).done(function (result) {
                AjaxRecieve(result);
            });
        });
	});
}

function JsonDataUpdate(d){
	d.board = board;
	d.puttable = [];

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
	DisplayChange(d.color,d.turn);
	return d;
}

function DisplayChange(color, turn){
    let $turn = $('#turn_display');
    let $color = $('#color_display');
    if(turn == 'you'){
        $turn.text("あなた");
    }else{
        $turn.text("相手");
    }
    if(color == 'black'){
        $color.text("くろ");
    }else{
        $color.text("しろ");
    }

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
            },200);
        }else {
            board[Number(idx[0])][Number(idx[1])] = 'B';
            $this_circle.animate({
                backgroundColor: '#000000',
                borderColor: '1px solid #008000',
            },200);
        }
    }
}

function Resolve(i) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(i);
        }, 200);
    })
}
