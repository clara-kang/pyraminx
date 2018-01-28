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
  // align vertices[1] with y
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
var normal1 = new THREE.Vector3(2 / Math.sqrt(6), 1 / 3, 2 / Math.sqrt(18));
var normal2 = new THREE.Vector3(-2 / Math.sqrt(6), 1 / 3, 2 / Math.sqrt(18));
var normal3 = new THREE.Vector3(0, 1 / 3, -1);
var normal4 = new THREE.Vector3(0, -1, 0);

var subPyraminx = [
  {tetras: [0, 3, 6, 1], normal: normal1.normalize(), point: new THREE.Vector3(0, 0, 0)},// the one close to origin
  {tetras: [2, 1, 7, 4], normal: normal2.normalize(), point: new THREE.Vector3(12 / Math.sqrt(6), 0, 0)}, //the one on +x
  {tetras: [5, 4, 8, 3], normal: normal3.normalize(), point: new THREE.Vector3(Math.sqrt(6), 0, 3 * Math.sqrt(2))}, //the one on +z
  {tetras: [9, 6, 8, 7], normal: normal4.normalize(), point: new THREE.Vector3(Math.sqrt(6), 3 * Math.sqrt(2), Math.sqrt(2))}]; //the one on +y

var indexToRotate = 3;
var animating = false;
var rotationProgress = 0;
window.addEventListener("keypress", function(event) {
  switch(event.key) {
    case "a":
      indexToRotate = 0;
      break;
    case "s":
      indexToRotate = 1;
      break;
    case "d":
      indexToRotate = 2;
      break;
    case "f":
      indexToRotate = 3;
      break;
  }
  animating = true;
  rotationProgress = 0;
  // switch (indexToRotate) {
  //   case 0:
  //     console.log("0!");
  //     subPyraminx[2].tetras[3] = subPyraminx[0].tetras[3];
  //     subPyraminx[3].tetras[1] = subPyraminx[0].tetras[1];
  //     subPyraminx[1].tetras[1] = subPyraminx[0].tetras[2];
  //     console.log(subPyraminx[2].tetras);
  //     break;
  //   case 1:
  //     console.log("1!");
  //     subPyraminx[2].tetras[1] = subPyraminx[1].tetras[1];
  //     subPyraminx[3].tetras[3] = subPyraminx[1].tetras[3];
  //     subPyraminx[0].tetras[4] = subPyraminx[1].tetras[2];
  //     break;
  //   case 2:
  //     console.log("2!");
  //     subPyraminx[1].tetras[3] = subPyraminx[2].tetras[2];
  //     subPyraminx[0].tetras[1] = subPyraminx[2].tetras[1];
  //     subPyraminx[3].tetras[2] = subPyraminx[2].tetras[3];
  //     break;
  //   case 3:
  //     console.log("3!");
  //     subPyraminx[0].tetras[2] = subPyraminx[3].tetras[2];
  //     subPyraminx[1].tetras[2] = subPyraminx[3].tetras[1];
  //     subPyraminx[2].tetras[2] = subPyraminx[3].tetras[3];
  //     break;
  // }
});

var dAngle;
var angleToRotate = Math.PI * 2 / 3; // amount to rotate subPyraminx per click
var tetraTriggerIndex = [0, 2, 5, 9]; // the index of tetrahedrons that triggers subPyraminx rotation when clicked on
var tetraIndex = -1; // intersected tetrahedron index in tetrahedrons array

window.addEventListener("click", function( event ) {
  if (animating == false && tetraIndex != -1) {
    switch (tetraIndex) {
      case 0:
        indexToRotate = 0;
        break;
      case 2:
        indexToRotate = 1;
        break;
      case 5:
        indexToRotate = 2;
        break;
      case 9:
        indexToRotate = 3;
        break;
    }
    // restaure opacity for rotating
    for (i = 0; i < 10; i++) {
      for (j = 0; j < 4; j++) {
        tetrahedrons[i].material[j].opacity = 1;
      }
    }
    animating = true;
    rotationProgress = 0;
  }
});

// render
function animate() {
  // if subPyraminx rotating and not finished
  if (animating == true && rotationProgress < angleToRotate) {
    dAngle = 0.02; // amount of rotation per frame
    // make sure to rotate to the exact position
    if (rotationProgress + dAngle > angleToRotate) {
      dAngle = angleToRotate - rotationProgress;
    }
    // rotate each tetrahedron in the subPyraminx
    for (pyrIndex of subPyraminx[indexToRotate].tetras) {
      //rotate the tetrahedron along the axis defined by the normal and the point
      tetrahedrons[pyrIndex].position.sub(subPyraminx[indexToRotate].point);
      tetrahedrons[pyrIndex].rotateOnWorldAxis ( subPyraminx[indexToRotate].normal, dAngle );
      tetrahedrons[pyrIndex].position.add(subPyraminx[indexToRotate].point);
    }
    // update rotation progress
    rotationProgress += dAngle;
      // if subPyraminx rotating and finished
  } else if (animating == true && rotationProgress >= angleToRotate) {
    animating = false;
    // if subPyraminx not rotating, then allow input
  } else {
    // update the picking ray with the camera and mouse position
  	raycaster.setFromCamera( mouse, camera );

  	// calculate objects intersecting the picking ray
  	var intersects = raycaster.intersectObjects( scene.children );
    if (intersects.length > 0) {
      // get object index in the tetrahedrons array, check if it belongs to a trigger tetrahedron
      if (tetraTriggerIndex.includes(tetraToIndex.get(intersects[ 0 ].object))) {
        tetraIndex = tetraToIndex.get(intersects[ 0 ].object);
        // lower the intersected obj opacity
        for (subPyrIndexList of subPyraminx) {
          // iterate over subPyraminx, check if it contains the tetrahedron
          if (subPyrIndexList.tetras.includes(tetraIndex)) {
            // if yes, lower the opacity of all tetrahedrons in the subPyraminx
            for (pyrIndex of subPyrIndexList.tetras) {
              for (j = 0; j < 4; j++) {
          		  tetrahedrons[pyrIndex].material[j].opacity = 0.5;
              }
            }
          }
        }
      }
    } else {
      tetraIndex = -1;
      for (i = 0; i < 10; i++) {
        for (j = 0; j < 4; j++) {
          tetrahedrons[i].material[j].opacity = 1;
        }
      }
    }
}

	requestAnimationFrame( animate );

  // tetrahedron.rotation.y += 0.01;
	renderer.render( scene, camera );
}
animate();
