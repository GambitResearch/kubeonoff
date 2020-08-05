import React from 'react'
import './MetricGauge.css'


const MetricGauge = ( {
		metric,  // null or a number between 0 and 1
		label,
	} ) => {

	if (metric === null)
		return null


    let color = '#90A4AE';
    const percent = Math.round(metric*100);

    if(percent >= 90){
      color = '#FF3D00';
    }
    else if(percent < 90 && percent >= 70){
      color = '#FF9800';
    }
    else if (percent < 70 && percent >= 50){
      color = '#FFEB3B';
    }
    else if (percent < 50 && percent >= 20){
      color = '#81C784';
    }
    else if (percent < 20 && percent >= 0){
      color = '#00E676';
    }

	return (
	  <div class="gauge outer">
       <div class="gauge column-wrapper"
       		title={label + ": " + percent + "%\n(usage divided by the limit)"}>
         <div class="gauge column"
        	style={{background: color, height: percent + "%"}}>
         </div>
       </div>
      </div>
    )
}

export default MetricGauge
