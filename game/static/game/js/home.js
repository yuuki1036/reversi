//home.html
//２人プレイ選択時に"COMの強さ"・"ヒントモード"を操作不能にする

function changeDiabled() {
    if($('select[name="mode"]').val() == 'person'){
        $('select[name="strength"]').prop('disabled', true);
        $('#div_id_strength').css('color', 'grey');
        $('input[name="hint"]').prop('disabled', true);
        $('#div_id_hint').css('color', 'grey');
    }else{
        $('select[name="strength"]').prop('disabled', false);
        $('#div_id_strength').css('color', 'inherit');
        $('input[name="hint"]').prop('disabled', false);
        $('#div_id_hint').css('color', 'inherit');
    }
}

changeDiabled();

$('select[name="mode"]').change(function () {
    changeDiabled()
});
