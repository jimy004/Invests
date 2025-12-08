 let datosSimulacion;

        document.getElementById('form-simulacion').addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.target;
            const data = Object.fromEntries(new FormData(form));
            data.montecarlo = form.montecarlo.checked;

            calcularSimulacion(data);
        });

        document.getElementById('btn-exportar').addEventListener('click', function() {
            if (!datosSimulacion) return;
            const labels = datosSimulacion.base.map((_,i)=>i+1);
            const rows = ['Mes,Pesimista,Base,Optimista'];
            labels.forEach((mes,i)=>{
                const fila = [
                    mes,
                    datosSimulacion.pesimista[i],
                    datosSimulacion.base[i],
                    datosSimulacion.optimista[i]
                ];
                rows.push(fila.join(','));
            });
            const blob = new Blob([rows.join('\n')], {type:'text/csv'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'simulacion.csv';
            a.click();
        });

        function calcularSimulacion(data){
            const capital = parseFloat(data.capital);
            const aportacion = parseFloat(data.aportacion);
            const rentabilidad = parseFloat(data.rentabilidad)/100;
            const anios = parseInt(data.anios);
            const incremento = parseFloat(data.incremento_aport||0)/100;

            const base = [], pesimista = [], optimista = [], montecarlo = [];

            let valor = capital, valorPes = capital, valorOpt = capital;
            for(let i=0;i<anios*12;i++){
                valor = valor*(1+rentabilidad/12)+aportacion*Math.pow(1+incremento, Math.floor(i/12));
                valorPes = valorPes*(1+rentabilidad*0.9/12)+aportacion*Math.pow(1+incremento, Math.floor(i/12));
                valorOpt = valorOpt*(1+rentabilidad*1.1/12)+aportacion*Math.pow(1+incremento, Math.floor(i/12));
                base.push(Math.round(valor*100)/100);
                pesimista.push(Math.round(valorPes*100)/100);
                optimista.push(Math.round(valorOpt*100)/100);
            }

            if(data.montecarlo){
                for(let m=0;m<5;m++){
                    let valorMC=capital, mc=[];
                    for(let i=0;i<anios*12;i++){
                        let rand=1+(rentabilidad/12)*(0.8+0.4*Math.random());
                        valorMC=valorMC*rand+aportacion*Math.pow(1+incremento, Math.floor(i/12));
                        mc.push(Math.round(valorMC*100)/100);
                    }
                    montecarlo.push(mc);
                }
            }

            datosSimulacion={base,pesimista,optimista,montecarlo};
            document.getElementById('btn-exportar').style.display='inline-block';
            mostrarGrafico(datosSimulacion);
        }

        function mostrarGrafico(datos){
            const series = [
                {name:'Pesimista', data: datos.pesimista, color:'red'},
                {name:'Base', data: datos.base, color:'blue'},
                {name:'Optimista', data: datos.optimista, color:'green'}
            ];

            if(datos.montecarlo && datos.montecarlo.length>0){
                datos.montecarlo.forEach(mc=>{
                    series.push({data:mc, color:'gray', dashStyle:'Dash', enableMouseTracking:false});
                });
            }

            Highcharts.chart('grafico-simulacion',{
                chart:{type:'line'},
                title:{text:'Simulación de crecimiento mensual'},
                xAxis:{categories:datos.base.map((_,i)=>i+1), title:{text:'Mes'}},
                yAxis:{title:{text:'Valor (€)'}},
                series:series,
                tooltip:{shared:true,valueDecimals:2}
            });
        }