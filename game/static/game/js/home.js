
$('select[name="mode"]').change(function () {
    if($(this).val() == 'person'){
        $('select[name="strength"]').prop('disabled', true);
        $('input[name="hint"]').prop('disabled', true);
    }else{
        $('select[name="strength"]').prop('disabled', false);
        $('input[name="hint"]').prop('disabled', false);
    }
});
