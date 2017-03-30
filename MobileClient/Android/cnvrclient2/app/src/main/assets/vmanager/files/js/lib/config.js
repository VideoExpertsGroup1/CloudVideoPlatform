/**
 * Created by Exception on 10.08.2015.
 */
define('config',['underscore'],function(_){
    return _.extend({},{
		cookie_url: "54.173.34.172",
		base_api_url: "http://54.173.34.172:8000/",
		debug: true,
        timeline : {
            hoverWidth: 7,
            hoverHeight: 27,
            playheadWidth: 2,
            playheadHeight: 27,
            playheadColor:'#FFF',
            ballRadius: 3.5,
            width: 1920,
            height: 65,
            emptyHeight: 3,
            margin: {
                top: 10,
                right: 0,
                bottom: 27,
                left: 0
            },
            minorTickSize:0,
            poolingInterval:3e4
        },
		md_zones: {
			global_conf: {
				zone_colors: ['#ff4d4d', '#ffb973', '#d9d900', '#36d900', '#00d9d9', '#4da6ff', '#a64dff', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb', '#bbbbbb'],
				enable_zones_by_checkbox: true
			},
			motion_detection: {
				caps:{
					columns: 50,
					rows: 30,
					max_regions: 8,
					sensitivity: "region", 	//"region" or "frame"
					region_shape: "rect"	//"rect" or "any"
				},
				//regions for "any"
				/*regions: [
					{
						enabled: true,
						map: "ZmIwMDAwMDJmYzAwMDEwMTgwZmMwMDAwZTBmYzAwMDAwOGZjMDAwMDAyZmIwMDAwODBmYzAwMDAyMGZjMDAwMDA4ODIwMGY3MDA=",
						sensitivity: 80
					},
					{
						enabled: true,
						map: "ZjMwMDAwMDdmYzAwMDEwMTIwZmMwMDAwNDhmYzAwMDAwMmZjMDAwMTAxODBmYzAwMDA0MGZjMDAwMDIwZmMwMDAwMzhmYzAwMDAxOGZjMDAwMDA0ZmMwMDAxMDFmYzkzMDA=",
						sensitivity: 30
					},
					{
						enabled: false,
						map: "ZjcwMDAwMDZmYzAwMDEwMzQwZmMwMDAwOTBmYzAwMDAwNGZjMDAwMDAxZmMwMDAxMDFjMGZjMDAwMGYwZmMwMDAwMDRmYzAwMDAwMWZiMDAwMDQwZmQwMDAxMDIzMGZjMDAwMGY4OTUwMA==",
						sensitivity: 10
					},
					{
						enabled: true,
						map: "OTcwMDAwMDFmYjAwMDBjMGZjMDAwMDIxZmMwMDAxMDg0MGZkMDAwMTAyMjBmZDAwMDEwMWY4ZmMwMDAwMDJmYzAwMDEwMTgwZmMwMDAwNDBmYzAwMDAzMGZjMDAwMDA4ZWYwMA==",
						sensitivity: 100
					},
					{
						enabled: false,
						map: "OGUwMDAxMGZlMGZkMDAwMDAyZmIwMDAwODBmYzAwMDAyMGZjMDAwMDBlZmMwMDAxMDI4MGZjMDAwMDYwZmQwMDAxMDEzMGZjMDAwMDc4ZWIwMA==",
						sensitivity: 80
					}
				]*/
				//regions for "rect"
				regions: [
					{
						enabled: true,
						map: "ZmIwMDAxMGY4MGZkMDAwMTAzZTBmYzAwMDBmOGZjMDAwMDNlZmMwMDAxMGY4MGZkMDAwMTAzZTBmYzAwMDBmOGZjMDAwMDNlODIwMGY3MDA=",
						sensitivity: 80
					},
					/*{
						enabled: true,
						map: "ZjkwMDAwN2ZmYzAwMDExZmMwZmQwMDAxMDdmMGZkMDAwMTAxZmNmYzAwMDA3ZmZjMDAwMTFmYzBmZDAwMDEwN2YwZmQwMDAxMDFmY2ZjMDAwMDdmZmMwMDAxMWZjMGZkMDAwMTA3ZjBmZDAwMDEwMWZjOTMwMA==",
						sensitivity: 30
					},
					{
						enabled: false,
						map: "ZjcwMDAwM2ZmYzAwMDEwZmMwZmQwMDAxMDNmMGZjMDAwMGZjZmMwMDAwM2ZmYzAwMDEwZmMwZmQwMDAxMDNmMGZjMDAwMGZjZmMwMDAwM2ZmYzAwMDEwZmMwZmQwMDAxMDNmMGZjMDAwMGZjOTUwMA==",
						sensitivity: 10
					},
					{
						enabled: true,
						map: "OTcwMDAxMDdmMGZkMDAwMTAxZmNmYzAwMDA3ZmZjMDAwMTFmYzBmZDAwMDEwN2YwZmQwMDAxMDFmY2ZjMDAwMDdmZmMwMDAxMWZjMGZkMDAwMTA3ZjBmZDAwMDEwMWZjZmMwMDAwN2ZlZjAw",
						sensitivity: 100
					},
					{
						enabled: false,
						map: "OGUwMDAxN2ZlMGZkMDAwMTFmZjhmZDAwMDEwN2ZlZmQwMDAyMDFmZjgwZmQwMDAxN2ZlMGZkMDAwMTFmZjhmZDAwMDEwN2ZlZmQwMDAyMDFmZjgwZmQwMDAxN2ZlMGVjMDA=",
						sensitivity: 80
					}*/
				]
			}
			
		},
		time_zones:[
			{'value': 'Africa/Abidjan', 'name': '(UTC+00:00)'},
		]
	})
});
