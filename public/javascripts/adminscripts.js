$(document).ready(function () {
    
    moment.locale('ru');
    const MOMENT_FORMAT = 'DD MMMM (ddd) YYYY';
    if ($('#chartHours').length > 0) {
        demo.initChartsPages();
    }
    
    SirTrevor.setDefaults({
        uploadUrl: "/images/upload",
        blockTypes: [
            "Heading",
            "Heading3",
            "Heading4",
            "Text",
            "List",
            "Table",
            "Image",
            "Video",
            "Pagebreak",
            "Shopbutton"
        ]
    });

    const editorTools = {
        header: {
            class: Header,
            inlineToolbar: ['link'],
            config: {
                placeholder: 'Заголовок',
                levels: [2, 3, 4],
                defaultLevel: 2
            },
            shortcut: 'CMD+SHIFT+H'
        },
        list: {
            class: List,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+L'
        },
        table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
        embed: Embed,
        delimiter: Delimiter,
        image: {
            class: ImageTool,
            config: {
                endpoints: {
                    byFile: '/admin/images/upload', // Your backend file uploader endpoint
                    byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
                }
            }
        },
        shopbutton: {
            class: ShopBtn
        }
    };

    const editorToolsMessage = {
        header: {
            class: Header,
            inlineToolbar: ['link'],
            config: {
                placeholder: 'Заголовок',
                levels: [2, 3, 4],
                defaultLevel: 2
            },
            shortcut: 'CMD+SHIFT+H'
        },
        list: {
            class: List,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+L'
        }
    };

    const editorToolsImage = {
        image: {
            class: ImageTool,
            config: {
                endpoints: {
                    byFile: '/images/upload', // Your backend file uploader endpoint
                    byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
                }
            }
        },
    };

    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: 'btn btn-success',
          cancelButton: 'btn btn-danger'
        },
        buttonsStyling: false
      })

    const editorToolsTeaser = {};

    const editors = {};
    showNotifications();
    initSirBlocks();
    initDatePicker();
    initFileUploads();
    initCopyContentBtn();
    initDeleteBtns();
    initPupilDisaprovedMsg();
    
    function initPupilDisaprovedMsg() {
        if ($('#pupilDisaprovedMsg').length > 0) {
            $(document).on('click', '#submitMessageBtn', onMessageopupSubmit)
        }
        
        function onMessageopupSubmit() {
            $('#requestImgNotApproved').val('off');
            $('#diplomImgNotApproved').val('off')
            
            var html = '';
            $('.messageCheckbox').each(function(i, el) {
                var messageId = $(el).data("messageid");
                var messageType = $(el).data("messagetype");
                if (el.checked) {
                    console.log(messageType)
                    console.log($(el).data("messageid"))
                    html += '<div data-messageid="' + messageId + '">';
                    html += $('.message-html[data-messageid=' + messageId + ']').html();
                    html += '</div>';
                    if (messageType === 0) {
                        $('#requestImgNotApproved').val('on')
                    }
                    if (messageType === 1) {
                        $('#diplomImgNotApproved').val('on')
                    }
                    
                }
            })
            
            $('#pupilDisaprovedMsgPreview').html(html) 
            $('#pupilDisaprovedMsg').val(html) 
            
            $('#templatesModal').modal('hide')
        }
    }
    function initDeleteBtns() {
        if ( $('.delete-doc-btn').length > 0 ) {
            $(document).on('click', '.delete-doc-btn', function(e){
                const deleteUrl = $(this).attr('href');
                e.preventDefault();
                console.log($(this).attr('href'), e)
                swalWithBootstrapButtons.fire({
                    title: 'Вы уверены?',
                    text: "Если нажать 'Ок', то произойдет безвозвратное удаление",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Ok',
                    cancelButtonText: 'Нет, не удалять',
                    reverseButtons: true
                  }).then((result) => {
                    if (result.value) {
                        window.location.pathname = deleteUrl;
                    } else if ( result.dismiss === Swal.DismissReason.cancel ) {
                      swalWithBootstrapButtons.fire(
                        'Удаление отменено!',
                        'Уфф.. спасли от удаления всё же..',
                        'error'
                      )
                    }
                  })
            })
        }
    }

    function initCopyContentBtn() {
        if ($('.copy-link').length > 0) {
            window.list = [];
            $('.copy-link').on('click', function(e){
                e.preventDefault();
                
                $.get('/admin/news/api/list', function (data) {
                    window.list = data;
                    len = list.length;
                    var el,
                        i = 0,
                        len,
                        table = $('#copyDataList tbody'),
                        name;
                    for (i = 0; i < len; i++) {
                            if (list[i].name) {
                            name = list[i].name.ru;
                        } else {
                            name = 'no name';
                        }
                        el = $('<tr>' + 
                            '<td>' + name + '</td>' +
                            '<td>' + moment(list[i].createdAt).format('DD.MM.YYYY') + '</td>' +
                            '<td>' + moment(list[i].updatedAt).format('DD.MM.YYYY') + '</td>' +
                            '<td>' + 
                            '<a class="btn btn-success btn-icon btn-sm post-content" ' +
                            'rel="tooltip" data-original-title="Скопировать" title="Скопировать" '+
                            'href="' + postUrl + '"'+
                            'data-id="' + list[i]._id + '">'+
                            '<i class="far fa-copy"></i>'+
                            '</a></td></tr>');
                        table.append(el);
                    }
                    $('#copyModal').modal('show');
                });            
            });

            $(document).on('click', '.post-content', function (e) {
                e.preventDefault();
                var id = $(this).data('id'),
                    i = 0,
                    len = window.list.length,
                    doc,
                    obj = [],
                    json,
                    names = ['bodynew', 'teasernew'], 
                    langs = ['ru', 'by', 'en'];
                            
                for (i = 0; i < len; i++) {
                    if (list[i]._id == id) {
                        doc = list[i];
                        break;
                    }
                }
                for( i=0; i < names.length; i++) {
                    for(var j = 0; j < langs.length; j++) {
                        json = JSON.stringify(doc[names[i]][langs[j]]); 
                        $('#' + names[i] + langs[j] + 'Data').val(json);
                        editors[names[i] + langs[j]].destroy();
                    }
                }
                
                initSirBlocks();
                $('#copyModal').modal('hide');
            });
        }
    }

    function initFileUploads() {
        if ($('#fileuploadImg').length > 0) {  
            $('#fileuploadImg').fileupload({
                add: function(e, data) {
                    $('.progress-bar').css(
                        'width',
                        '0%'
                    )
                    $('.progress').fadeIn();
                    data.submit();
                },
                
                progress: function(e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('.progress-bar').css(
                        'width',
                        progress + '%'
                    );
                },
                done: function(e, data) {
                    var inputValue = {
                        file: data.result.file
                    }
                    $('#imagenew').val(JSON.stringify(inputValue))
                    $('.progress').fadeOut();
                    $('#fileInputContainer').removeClass('fileinput-new').addClass('fileinput-exists')
                    $('#fileInputThumbnail').attr('src', data.result.file.url);           
                }
            });
        }
    }

    function initDatePicker() {
        if ($(".datepicker").length != 0) {
            $('.datepicker').datetimepicker({
              format: MOMENT_FORMAT,// 'MM/DD/YYYY',
              icons: {
                time: "fa fa-clock-o",
                date: "fa fa-calendar",
                up: "fa fa-chevron-up",
                down: "fa fa-chevron-down",
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-screenshot',
                clear: 'fa fa-trash',
                close: 'fa fa-remove'
              }
            });

            $('#dataForm').on('submit', function(e) {
                e.preventDefault();
                console.log('asd')
                $('.datepicker').each(function(i, input) {
                    var $input = $(input);
                    var date = moment($input.val(), MOMENT_FORMAT ).toDate();
                    $input.val(date)
                   // console.log(moment($(input).val(), MOMENT_FORMAT ).toDate())
                })
                $(this).unbind('submit').submit();
            })
          }
    }

    function initSirBlocks() {
        if ($('#messageTemplate').length) {
            createEditor('messageTemplate', false, true)
        }
        if ($('#bodynewru').length) {
            createEditor('bodynewru')
        }
        if ($('#bodynewby').length) {
            createEditor('bodynewby')
        }
        if ($('#bodynewen').length) {
            createEditor('bodynewen')
        }

        if ($('#teasernewru').length) {
            createEditor('teasernewru', true)
        }
        if ($('#teasernewby').length) {
            createEditor('teasernewby', true)
        }
        if ($('#teasernewen').length) {
            createEditor('teasernewen', true)
        }
        if ($('#image').length) {
        //    createImageEditor('image')
        }
        /*if ($('#image').length) {
            new SirTrevor.Editor({
                el: $('#image'),
                blockTypes: ["Image"],
                blockTypeLimits: {
                    "Image": 1
                }
            });
        }*/
        /*if ($('#mediaimage').length) {
            SirTrevor.setDefaults({
                uploadUrl: "/images/mediaupload",
            });
            new SirTrevor.Editor({
                el: $('#mediaimage'),
                blockTypes: ["Image"],
                blockTypeLimits: {
                    "Image": 1
                }
            });

        }*/
    };

    function createEditor(name, isTeaser, isMessage) {
        const $input = $('#' + name + 'Data');
        let tools = editorTools;
        if (isTeaser) {
            tools = editorToolsTeaser
        }
        if (isMessage) {
            tools = editorToolsMessage
        }
        editors[name] = new EditorJS({
            holderId: name,
            tools: tools,
            data: JSON.parse($input.val()),
            onChange: function () {
                editors[name].save().then(function (data) {
                    $input.val(JSON.stringify(data))
                })
            }
        });
    }


    function showNotifications() {
        if ($('#alertMessage').text().length > 0) {
            if ($('#alertMessage').find('.alert').hasClass('alert-danger')) {
                showNotification('danger', $('#alertMessage').find('.alert').html());
                
            }
            if ($('#alertMessage').find('.alert').hasClass('alert-success')) {
                showNotification('primary', $('#alertMessage').find('.alert').html());
            }
        }
    }

    function showNotification(color, html) {
        color = color; 
        
        $.notify({
            icon: "nc-icon nc-bell-55",
            message: html

        }, {
            type: color,
            timer: 8000,
            placement: {
                from: 'top',
                align: 'center'
            }
        });
    }
});