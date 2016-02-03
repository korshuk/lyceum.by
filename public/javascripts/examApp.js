$(function() {
    var currentUser = {};
    var table = $('#examGrid').DataTable({
        ajax: {
            url: '/admin/exams/rest',
            dataSrc: ''
        },
        columnDefs: [ 
                {
                    searchable: false,
                    orderable: false,
                    targets: 0
                },
                {
                    targets: -1,
                    data: null,
                    searchable: false,
                    orderable: false,
                    defaultContent: "<button>Click!</button>"
                } 
            ],
        order: [[ 1, 'asc' ]],
        columns: [
            { data: null },
            { data: 'passport' },
            { data: 'data[0].vid' },
            { data: 'data[0].num' },
            { data: null },
        ]
    });

    table.on( 'order.dt search.dt', function () {
        table.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
            cell.innerHTML = i+1;
        } );
    } ).draw();

    table.on( 'click', 'button', function () {
        var data = table.row( $(this).parents('tr') ).data();
        $.get('/admin/exams/rest/' + data._id, function (response) {
            currentUser = response;
            $('#examPassport').val(response.passport);
            $('#examNum').val(response.data.slice(-1)[0].num);
            $('#examModal').modal('show');
        })
    });

    $(document).on('click', '#updatePupil', function() {
        currentUser.passport = $('#examPassport').val();
        currentUser.data[currentUser.data.length - 1].num = $('#examNum').val();

        $.post('/admin/exams/rest/' + currentUser._id, currentUser, function (response) {
            $('#examModal').modal('hide'); 
            table.ajax.reload();
            currentUser = {};
        });
    });

    $(document).on('click', '#versionBtn', function() {
        $.get('/admin/exams/version-list', function(response) {
            var $template = $('<ul></ul>');
            var $item;
            var date;
            var options = {year: "numeric", month: "short",day: "numeric"};

            $template.addClass('list-group');
            for (var i = 0; i < response.length; i++) {
                date = new Date(response[i].date);
                $item = $('<li></li>')
                    .addClass('row list-group-item')
                    .text(response[i].vid + ' ' + date.toDateString("ru-ru", options) + ' ' + date.toTimeString("ru-ru", options))
                    .append('<a href="/admin/exams/deleteversion/' + response[i]._id + '" class="pull-right btn btn-danger">Delete</button>');
                $template.append($item);
            };
            $('#versionModal').find('.modal-body').html($template).end().modal('show');
        });
    });
});