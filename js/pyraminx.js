var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );
camera.position.set (2, 0, 9);
// camera.rotateY(Math.PI * 1 / 8);

// x, y ,z axis for convinience
var x = new THREE.Vector3(1, 0, 0);
var y = new THREE.Vector3(0, 1, 0);
var z = new THREE.Vector3(0, 0, 1);

// the array of tetrahedrons
var tetrahedrons = [];
var tetraToIndex = new Map();

// first tetrahedron
// var geometry = new THREE.TetrahedronGeometry( 1, 0 );
var geometry = new THREE.TetrahedronGeometry( 1, 0 );

// map different material to each face
for (i = 0; i < 4; i++) {
  geometry.faces[ i ].materialIndex = i; // materialA
}

// create tetrahedron mesh
// var tetrahedron = new THREE.Mesh( geometry, faceMaterial );

function positionTetrahedron(tetrahedron) {
  // position it
  var vertexVector = tetrahedron.geometry.vertices[1].clone();
  var rotationAxis = new THREE.Vector3();
  rotationAxis.crossVectors(vertexVector, y);
  tetrahedron.rotateOnWorldAxis ( rotationAxis.normalize(), vertexVector.angleTo(y) );
  tetrahedron.position.y += 1 / 3;
  tetrahedron.rotateOnWorldAxis ( y, Math.PI / 12 );
  tetrahedron.position.z += 2 / Math.sqrt(18);
  tetrahedron.position.x += 2 / Math.sqrt(6);
}

// add the rest of tetrahedrons
var rowCnt = 3;
var colCnt = 3;
var levelCnt = 3;
var cnt = 0;
for (k = 0; k < levelCnt; k++) {
  for (j = 0; j < levelCnt - k; j++) {
    for (i = 0; i < levelCnt - k - j; i++, cnt++) { // each row
      // create tetrahedron and add to array of tetrahedrons
      tetrahedrons.push(new THREE.Mesh( geometry, [
        new THREE.MeshLambertMaterial( {color: 0xffff00, transparent: true, side: THREE.DoubleSide} ),
        new THREE.MeshLambertMaterial( {color: 0x0000ff, transparent: true, side: THREE.DoubleSide} ),
        new THREE.MeshLambertMaterial( {color: 0xff0000, transparent: true, side: THREE.DoubleSide} ),
        new THREE.MeshLambertMaterial( {color: 0x00ff00, transparent: true, side: THREE.DoubleSide} ),
      ] ));
      // adjust angles & position
      positionTetrahedron(tetrahedrons[cnt]);
      // position it
      tetrahedrons[cnt].position.y += k * 4 / 3;
      tetrahedrons[cnt].position.z += j * Math.sqrt(2) + k * 2 / Math.sqrt(18);
      tetrahedrons[cnt].position.x += j * 2 / Math.sqrt(6) + i * (4 / Math.sqrt(6)) + k * 2 / Math.sqrt(6);
      // add to index map
      tetraToIndex.set(tetrahedrons[cnt], cnt);
      scene.add(tetrahedrons[cnt]);
    }
  }
}


// OrbitControls
var controls = new THREE.OrbitControls(camera, renderer.domElement);

// light
var pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
pointLight.position.set( 2, 5, 1 );
scene.add( pointLight );
var ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );


// arrow helper
//normalize the direction vector (convert to vector of length 1)
var origin = new THREE.Vector3( 0, 0, 0 );
var length = 2;
var hex = 0xffff00;
var arrowHelperX = new THREE.ArrowHelper( x, origin, length, 0xffff00 );
var arrowHelperY = new THREE.ArrowHelper( y, origin, length, 0xff0000 );
var arrowHelperZ = new THREE.ArrowHelper( z, origin, length, 0x0000ff );
scene.add( arrowHelperX );
scene.add( arrowHelperY );
scene.add( arrowHelperZ );

window.addEventListener("keypress", function(event) {
})

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

window.addEventListener( 'mousemove', onMouseMove, false );

function restaurelastIntersectObj(lastIntersectObj) {
  if (lastIntersectObj != null) {
    // not same intersected target, restore last intersected obj's opacity
    for (j = 0; j < 4; j++) {
      lastIntersectObj.material[j].opacity = 1;
    }
  }
}

var lastIntersectObj = null;
// the one close to origin, the one on +x, the one on +z, the one on +y
var subPyraminx = [[0, 3, 6, 1], [2, 1, 7, 4], [5, 4, 8, 3], [9, 6, 8, 7]];

// render
function animate() {
  // update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );
  if (intersects.length > 0) {
    console.log("intersect index: " + tetraToIndex.get(intersects[ 0 ].object));
    // lower the intersected obj opacity
    for (subPyrIndexList of subPyraminx) {
      if (subPyrIndexList.includes(tetraToIndex.get(intersects[ 0 ].object))) {
        for (pyrIndex of subPyrIndexList) {
          console.log("pyrIndex: " + subPyrIndexList);
          for (j = 0; j < 4; j++) {
      		  tetrahedrons[pyrIndex].material[j].opacity = 0.5;
            //console.log("intersected index: " + tetraToIndex.get(intersects[ 0 ].object));
          }
        }
      }
    }
  } else {
    for (i = 0; i < 10; i++) {
      for (j = 0; j < 4; j++) {
        tetrahedrons[i].material[j].opacity = 1;
        //console.log("intersected index: " + tetraToIndex.get(intersects[ 0 ].object));
      }
    }
  }

	requestAnimationFrame( animate );

  // tetrahedron.rotation.y += 0.01;
	renderer.render( scene, camera );
}
animate();
