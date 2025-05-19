

//const [lng, lat] = locations[0].coordinates;
export const displayMap=(locations) =>{
  mapboxgl.accessToken = 'pk.eyJ1IjoieXVrdGhhLTA5IiwiYSI6ImNtYXNtZDdyNTBqcHMybnE4Z2k3Z285MXUifQ.pP4QE9QsxVsYos-9_tqbVw';  // your token

   const map = new mapboxgl.Map({
  container: 'map',
  style:     'mapbox://styles/mapbox/streets-v12', // <— pasted from Studio
  //center:    [74.5, 40],
  //zoom:      9
});

const bounds= new mapboxgl.LngLatBounds();

locations.forEach( loc =>{
    const el = document.createElement('div');
    el.className='marker';

     new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
     .setLngLat(loc.coordinates)
     .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

     bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
}

