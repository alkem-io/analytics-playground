/**
 * Simple force directed graph component which displays a specific image for each Node in the
 * place where that Node is arranged by the force directed graph.
 */

export class Image {
  svg: any;
  imageContainer: any;
  image: any;

  constructor(svg: any) {
    this.svg = svg;
  }

  registerImageContainer(nodes: any, nodeScale: any) {
    this.imageContainer = this.svg
      .append('g')
      .attr('class', 'imagecontainer')
      .selectAll('g.imageContainer')
      .data(nodes)
      .enter()
      .append('g');

    this.image = this.imageContainer
      .append('image')
      .attr('height', (d: any) => nodeScale(d.weight))
      .attr('width', (d: any) => nodeScale(d.weight))
      .attr(
        'transform',
        (d: any) =>
          `translate(${-nodeScale(d.weight) / 2}, ${-nodeScale(d.weight) / 2})`
      )
      .attr('href', (d: any, i: any) => `image/img-0.png`);
  }

  animate() {
    this.imageContainer.attr(
      'transform',
      (d: any) => `translate(${d.x}, ${d.y})`
    );
  }
}
