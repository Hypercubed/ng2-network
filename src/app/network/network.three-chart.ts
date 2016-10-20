declare var d3: any;
declare var THREE: any;

export default function ThreeNetwork (opts) {
  opts = opts || {};

  let width = opts.width || 960;
  let height = opts.height || 800;
  // const title = opts.title || 'Network';

  const force = d3.layout.force()
    .charge(-60)
    .linkDistance(30)
    .size([width, height]);

  const color = d3.scale.category20();

  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  // renderer.setClearColor( 0x000000, 0);

  const raycaster = new THREE.Raycaster();

  const tip = d3.tip()
    .attr('class', 'd3-tip animate')
    .offset([0, 0])
    .html(d => `${d.ip}`);

  const dispatch = d3.dispatch('mouseover', 'mouseout', 'contextmenu');

  const chart: any = function chart (selection) {
    selection.each(function (graph) {
      // console.log('update');

      const container = this;

      // use to track mouse for tool-tip
      const svg = d3.select(container).append('svg')
        .style('position', 'absolute')
        .style('width', '1px')
        .style('height', '1px')
        .style('pointer-events', 'none')
        .call(tip);

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera( 75, width / height, 1, 10000 );
      camera.position.x = width;
      camera.position.y = -height;
      camera.position.z = 1100;

      const nodeData = graph.nodes.filter(d => d.visible);
      const linkData = graph.links.filter(d => d.target.visible && d.source.visible);

      const nodes = nodeData.map(createNode);
      const links = linkData.map(createLink);

      links.forEach(l => scene.add(l));
      nodes.forEach(n => scene.add(n));

      renderer.setSize( width, height );

      container.appendChild( renderer.domElement );

      force
        .size([width, height])
        .nodes(nodeData)
        .links(linkData)
        .start();

      force.on('tick', () => {
        links.forEach((link, i) => {
          const d = linkData[i];
          link.geometry.vertices[0].set(2 * d.source.x, 2 * -d.source.y, 0);
          link.geometry.vertices[1].set(2 * d.target.x, 2 * -d.target.y, 0);
          link.geometry.verticesNeedUpdate = true;
        });

        nodes.forEach((node, i) => {
          const d = nodeData[i];
          node.position.x = 2 * d.x;
          node.position.y = 2 * -d.y;
        });

        renderer.render( scene, camera );
      });

      container.addEventListener('mousemove', event => {
        const mouse = _getRelativeMouseXY(event);
        const intersects = getIntesection(mouse);
        if (intersects) {
          svg
            .style('top', `${event.clientY - 15}px`)
            .style('left', `${event.clientX}px`);
          tip.show(intersects, svg.node());
        } else {
          tip.hide();
          // ctx.classed('open', false);
        }
      }, false );

      container.addEventListener('contextmenu', event => {
        event.preventDefault();
      });

      container.addEventListener('mousedown', function(event) {
        // using mousedown vs. contextmenu because firefox
        if (event.which === 3) {  // right click
          const mouse = _getRelativeMouseXY(event);
          const intersects = getIntesection(mouse);
          if (intersects) {
            event.preventDefault();
            return dispatch.contextmenu.call(container, event, intersects);
          }
        }
        return dispatch.contextmenu.call(container, event, null);
      });

      function getIntesection (mouse) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(nodes);
        if (intersects.length > 0) {
          return graph.nodes[+intersects[0].object.name];
        }
        return null;
      }

      function createNode(d) {
        const size = 10;
        const nodeGeometry = new THREE.CircleGeometry(size, size);
        const nodeMaterial = new THREE.MeshBasicMaterial({ color: color(d.group) });
        const mesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        mesh.position.z = size / 2;
        mesh.name = d.id;
        return mesh;
      }

      function createLink(d) {
        const linkGeometry = new THREE.Geometry();
        linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

        const linkMaterial = new THREE.LineBasicMaterial({ color: '#999', linewidth: Math.sqrt(d.value) });
        return new THREE.Line(linkGeometry, linkMaterial);
      }
    });
  };

  chart.width = function (_) {
    if (arguments.length < 1) {
      return width;
    }
    width = _;
    return chart;
  };

  d3.rebind(chart, dispatch, 'on');

  return chart;
}

// from https://github.com/jeromeetienne/threex.domevents/blob/master/threex.domevents.js
function _getRelativeMouseXY (domEvent) {
  let element = domEvent.target || domEvent.srcElement;
  if (element.nodeType === 3) {
    element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
  }

  // get the real position of an element relative to the page starting point (0, 0)
  // credits go to brainjam on answering
  // http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
  const elPosition  = { x : 0 , y : 0};
  let tmpElement  = element;
  // store padding
  let style = getComputedStyle(tmpElement, null);
  elPosition.y += parseInt(style.getPropertyValue('padding-top'), 10);
  elPosition.x += parseInt(style.getPropertyValue('padding-left'), 10);
  // add positions
  do {
    elPosition.x += tmpElement.offsetLeft;
    elPosition.y += tmpElement.offsetTop;
    style = getComputedStyle(tmpElement, null);

    elPosition.x += parseInt(style.getPropertyValue('border-left-width'), 10);
    elPosition.y += parseInt(style.getPropertyValue('border-top-width'), 10);
  } while (tmpElement = tmpElement.offsetParent);

  const elDimension  = {
    width  : (element === window) ? window.innerWidth  : element.offsetWidth,
    height  : (element === window) ? window.innerHeight  : element.offsetHeight
  };

  return {
    x : +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
    y : -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
  };
};
