const https = require("https");
const host = 'ruoa.unam.mx';
const port = 8042;
const fs = require("fs");
const urlp = require('url');

const path_data = "../data/";
const path_ssl = "../ssl/";

const header ={
  'Access-Control-Allow-Origin':'*'
};

const getYears = function(filelist){
    let years = [];
    for (filename of filelist){
        name_sp = filename.split('_');
        newyear = name_sp[ name_sp.length - 1].split('-')[0];
        if (!years.includes(newyear)){
            years.push(newyear);
        }

    }
    return years;
}

const getMonths = function(filelist, year){
    let  months = [];
    for (filename of filelist){
        //console.log('mes:', filename, newmonth, newmonth.includes(filename));
        name_sp = filename.split('_');
        mon = name_sp[ name_sp.length - 1].split('-')[1];
        newmonth = year+"-"+mon;
        if (filename.includes('_'+year) && !months.includes(newmonth)){
            months.push(newmonth);
        }
    }
    return months;
}

const getDays= function(filelist, year_m){
    let  days = [];
    for (filename of filelist){
        name_sp = filename.split('_');
        d = name_sp[ name_sp.length - 1].split('-')[2];
        newday = year_m+ "-" + d.split('.')[0];
        if (filename.includes('_'+year_m) && !days.includes(newday)){
            days.push(newday);
        }
    }
    return days;
}

const getFileList= function( path_full){
    if ( !fs.existsSync( path_full) ){
        return [];
    }
    return fs.readdirSync(path_full);

}

const requestListener = function (req, res) {
    const {headers, method, url} = req;
    list_par = ["datetime", "uid", "rain" ];
    //console.log('url:', url, method, headers)
    let list_data = {};
    const url_check = url.split('&')[0]
    if (url_check == '/pm_api' || url_check == '/?pm_api=' ){
      let body=[];
      req.on('data', (chunk) => {
        body.push(chunk);
      });
      req.on('end',() =>{ 

        if (method == 'GET'){
          const params = new urlp.URLSearchParams(url);
          console.log('get:', params);
          console.log('keys:', params.keys());
          keys = Array.from(params.keys());
          ksize = keys.length;
          if ( ksize == 3 && params.has('sid')){
              if ( params.has('year') ){
                  console.log('año', params.get('year'));
                  months= getMonths( getFileList(path_data + params.get("sid")),
                      params.get('year'));
                  console.log(months);
                  res.writeHead(200, header);
                  res.end(months.join(','));
              }else if ( params.has('month') ){
                  days = getDays( getFileList(path_data + params.get("sid")), params.get("month") );
                  res.writeHead(200, header);
                  res.end(days.join(','));

              }else if(params.has('date')){
                  csv_name = params.get('sid') + '_' + params.get('date') + '.csv';
                  path_full = path_data+ params.get("sid") +"/" ;
                  path_full += csv_name;
                  console.log('path:', path_full);
                  if ( !fs.existsSync( path_full) ){
                      console.log('no existe archivo')
                      res.writeHead(400, header);
                      res.end('No data');
                      return 0;
                  }
                  //lee archivo
                  const data_raw = fs.readFileSync(path_full, encoding='utf8' );
                  //console.log(data_raw);
                  // header file type
                  const head_ft = { 'Content-Type' : 'text/csv',
                  "Content-Disposition": 'attachment; filename="'+csv_name + '"'};
                  res.writeHead(200, { ...header, ...head_ft});
                  res.end(data_raw);

              }else{
                  console.log('no existe archivo')
                  res.writeHead(400, header);
                  res.end('No data');
                  return 0;
              }
          }//params 3
          else if( ksize == 2){
              if (params.has('sid')){
                  console.log('sid', path_data);
                  years= getYears( getFileList(path_data + params.get("sid")));
                  console.log(years);
                  res.writeHead(200, header);
                  res.end(years.join(','));
              }else{
                  console.log('no existe archivo')
                  res.writeHead(400, header);
                  res.end('No data');
                  return 0;
              }

          }
        }//get

      });//req end

    }//if
};

var options = {
    key: fs.readFileSync(path_ssl+ 'ruoa.key'),
    cert: fs.readFileSync(path_ssl+ 'Wc_ruoa.unam.mx.cer'),
    ca: fs.readFileSync(path_ssl+ 'UNAM_Root_R3_raiz.pem'),
};

const server = https.createServer(options, requestListener);
server.listen(port, host, () => {
	    console.log(`https://${host}:${port}`);
});
