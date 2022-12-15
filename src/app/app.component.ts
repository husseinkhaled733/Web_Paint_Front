import {Component, OnInit} from '@angular/core';
import {Konva} from "konva/cmj/_FullInternals";
import {ShapeService} from './shape-service.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {

  title = "Paint";
  layer: any;
  stage: any;
  transform: any;
  currentSelector = "screen";
  lastEvent: any;
  colorEvent: any;
  color: string = "black";
  size = 5;
  selectedShape: any;
  selectedFiles?: FileList;
  currentFile?: File;
  message = '';
  filename = "";
  form = "JSON";
  pop = false;
  selected=false;
  log = console.log;

  constructor(private service: ShapeService) {}

  ngOnInit(): void {

    let width = window.innerWidth * (82 / 100);
    let height = window.innerHeight * (95 / 100);
    this.stage = new Konva.Stage({
      container: 'board',
      width: width,
      height: height,
    });
    this.transform = new Konva.Transformer();
    this.layer = new Konva.Layer();
    this.layer.add(this.transform);
    this.stage.add(this.layer);

    // this.service.refresh().subscribe(responseData => {
    //   if (responseData === null) {
    //     console.log("cannot refresh");
    //     return;
    //   }
    //   let tempShape = responseData['shapes'];
    //   let arr = <Array<any>>tempShape;
    //   arr.forEach((shape) => {
    //     this.processOperation("CREATE", shape);
    //   });
    //   this.layer.getChildren().forEach(function (node: any) {
    //     node.draggable(false);
    //   });
    // })

    this.stage.on("click", (event: any) => {
      if (this.currentSelector !== "screen") {
        this.selectedShape = null;
        return;
      }
      this.layer.getChildren().forEach(function (node: any) {
        node.draggable(false);
      });
      let id = event.target.attrs.id;
      
      if (id != undefined) {
        let shape = event.target;
        this.selectedShape = event.target;
        this.transform.nodes([shape]);
        shape.draggable(true);

        shape.on('dragmove', ()=> {
          console.log(shape.x());
        })

        shape.on('transformend', () => {   
          this.service.updateShape(shape.toJSON());
        });

        shape.on('dragend', () => {
          this.service.updateShape(shape.toJSON());
        });

      } else {
        this.transform.nodes([]);
        this.currentSelector = "screen";
        this.selectedShape = "";
      }
    });

  }

  public generateID(shape: any) {
    this.service.createShape(shape.toJSON()).subscribe(responseData => {
        console.log(responseData);
        shape.id(responseData['id']);
      }
    );
  }


  public drawShape(event: any) {

    this.stage.off('mousedown');
    this.stage.off('mouseup');
    this.stage.off('mousemove');
    this.transform.nodes([]);
    this.layer.getChildren().forEach(function (node: any) {
      node.draggable(false);
    });

    let type = this.getType(event);
    if (this.lastEvent != null) {
      this.lastEvent.target.style.background = "#ffffff";
    }
    this.lastEvent = event;

    if (this.currentSelector != type) {
      this.currentSelector = type;
      event.target.style.background = "#62666846";
    } else {
      this.currentSelector = "screen";
      event.target.style.background = "#ffffff";
      return;
    }

    let shape: any;
    let isNowDrawing = false;

    this.stage.on("mousedown", () => {
      shape = this.getShape(type);
      isNowDrawing = true;
      let pos = this.stage.getPointerPosition();
      shape.x(pos.x);
      shape.y(pos.y);
      shape.stroke(this.color);
      shape.strokeWidth(this.size);

      if (type === "Rectangle" || type === "Square") {
        shape.width(0);
        shape.height(0);
      } else if (type === "Circle") {
        shape.radius(0);
      } else if (type === "Ellipse") {
        shape.radiusX(0);
        shape.radiusY(0);
      } else if (type === "Triangle") {
        shape.sides(3);
        shape.radius(0);
      } else if (type === "RegularPolygon") {
        shape.sides(5);
        shape.radius(0);
      }

      this.layer.add(shape).batchDraw();
    });

    this.stage.on("mousemove", () => {
      if (isNowDrawing) {
        let pos = this.stage.getPointerPosition();

        if (type === "Rectangle" || type === "Triangle" || type === "RegularPolygon") {
          shape.width(pos.x - shape.x());
          shape.height(pos.y - shape.y());
        } else if (type === "Square") {
          let newX: number = pos.x - shape.x();
          let newY: number = pos.y - shape.y();
          let x: number = Math.min(newX, newY);
          shape.width(x)
          shape.height(shape.width());
        } else if (type === "Circle") {
          let rise = Math.pow(pos.y - shape.y(), 2);
          let run = Math.pow(pos.x - shape.x(), 2);
          let newRadius = Math.sqrt(rise * run);
          shape.radius(newRadius / 400);
        } else if (type === "Ellipse") {
          shape.radiusX(Math.abs(pos.x - shape.x()));
          shape.radiusY(Math.abs(pos.y - shape.y()));
        }

        this.layer.batchDraw();
      }
    });

    this.stage.on("mouseup", () => {
      isNowDrawing = false;
      shape.setAttr('type', type);
      this.generateID(shape);
    });

  }

  public freeHand(event: any) {

    this.stage.off('mousedown');
    this.stage.off('mouseup');
    this.stage.off('mousemove');
    this.transform.nodes([]);
    this.layer.getChildren().forEach(function (node: any) {
      node.draggable(false);
    });

    if (this.lastEvent != null) {
      this.lastEvent.target.style.background = "#ffffff";
    }
    this.lastEvent = event;

    if (this.currentSelector != "FreeHand") {
      this.currentSelector = "FreeHand";
      event.target.style.background = "#62666846";
    } else {
      this.currentSelector = "screen";
      event.target.style.background = "#ffffff";
      return;
    }

    let line: any;
    let isNowDrawing = false;

    this.stage.on("mousedown", () => {
      console.log(this.color);
      line = new Konva.Line();
      isNowDrawing = true;
      let pos = this.stage.getPointerPosition();
      line.points([pos.x, pos.y]);
      line.stroke(this.color);
      line.strokeWidth(this.size);
      line.lineCap("round");
      line.lineJoin("round");
      this.layer.add(line).batchDraw();
    });

    this.stage.on("mousemove", () => {
      if (isNowDrawing) {
        let pos = this.stage.getPointerPosition();
        line.points(line.points().concat([pos.x, pos.y]));
        line.lineCap("round");
        line.lineJoin("round");
        this.layer.batchDraw();
      }
    });

    this.stage.on("mouseup", () => {
      isNowDrawing = false;
      line.setAttr('type', "LineSegment");
      this.generateID(line);
    });

  }

  public drawLine(event: any) {

    this.stage.off('mousedown');
    this.stage.off('mouseup');
    this.stage.off('mousemove');
    this.transform.nodes([]);
    this.layer.getChildren().forEach(function (node: any) {
      node.draggable(false);
    });

    if (this.lastEvent != null) {
      this.lastEvent.target.style.background = "#ffffff";
    }
    this.lastEvent = event;

    if (this.currentSelector != "line") {
      this.currentSelector = "line";
      event.target.style.background = "#62666846";
    } else {
      this.currentSelector = "screen";
      event.target.style.background = "#ffffff";
      return;
    }

    let line: any;
    let isNowDrawing = false;

    this.stage.on("mousedown", () => {
      line = new Konva.Line();
      isNowDrawing = true;
      let pos = this.stage.getPointerPosition();
      line.points([pos.x, pos.y, pos.x, pos.y]);
      line.stroke(this.color);
      line.strokeWidth(this.size);
      line.lineCap("round");
      line.lineJoin("round");
      this.layer.add(line).batchDraw();
    });

    this.stage.on("mousemove", () => {
      if (isNowDrawing) {
        let pos = this.stage.getPointerPosition();
        line.points()[2] = pos.x;
        line.points()[3] = pos.y;
        line.lineCap("round");
        line.lineJoin("round");
        this.layer.batchDraw();
      }
    });

    this.stage.on("mouseup", () => {
      isNowDrawing = false;
      line.setAttr('type', "LineSegment");
      this.generateID(line);
    });

  }

  public fillshape(event : any) {

    if (this.lastEvent != null) {
      this.lastEvent.target.style.background = "#ffffff";
    }
    this.lastEvent = event;

    if (this.currentSelector != "fillShape") {
      this.currentSelector = "fillShape";
      event.target.style.background = "#62666846";
      this.layer.getChildren().forEach(function (node: any) {
        node.draggable(false);
      });
      this.stage.off('mousedown mouseup mousemove');
      this.stage.on("mousedown", (event: any) => {
        if(event.target.attrs.id != undefined) {
          event.target.fill(this.color);
          let shape = event.target;
          this.service.updateShape(shape.toJSON());
        }
      });
    } else {
      this.currentSelector = "screen";
      event.target.style.background = "#ffffff";
    }

  }

  public copy() {
    if (this.selectedShape !== null) {
      let newShape = this.selectedShape.clone();
      this.service.copyShape(this.selectedShape.id()).subscribe(responseData => {
        newShape.id(responseData['id']);
        newShape.draggable(false);
        this.layer.add(newShape).batchDraw();
        this.selectedShape=null;
      });
      this.layer.getChildren().forEach(function (node: any) {
        node.draggable(false);
      });
      this.transform.nodes([]);
    }
  }

  public delete() {
    if (this.selectedShape !== null) {
      let shape = this.selectedShape;
      this.service.deleteShape(shape.id());
      shape.destroy();
      this.transform.nodes([]);
      this.selectedShape = null;
      this.layer.getChildren().forEach(function (node: any) {
        node.draggable(false);
      });
    }
  }

  public undo() {
    this.service.undo().subscribe(responseData => {
      console.log(responseData);
      if(responseData === null) {
        console.log("cannot undo");
        return;
      }
      let tempShape = responseData['shapes'];
      let operation = responseData['operation'];
      let arr = <Array<any>>tempShape;
      arr.forEach((shape) => {
        this.processOperation(operation, shape);
      });
    })
    this.layer.getChildren().forEach(function (node: any) {
      node.draggable(false);
    });
    this.transform.nodes([]);
  }

  public redo() {
    this.service.redo().subscribe(responseData => {
      if(responseData === null) {
        console.log("cannot redo");
        return;
      }
      console.log(responseData);
      let tempShape = responseData['shapes'];
      let operation = responseData['operation'];
      let arr = <Array<any>>tempShape;
      console.log(tempShape);
      console.log(operation);
      arr.forEach((shape) => {
        this.processOperation(operation, shape);
      });
    })
    this.layer.getChildren().forEach(function (node: any) {
      node.draggable(false);
    });
    this.transform.nodes([]);
  }

  public clear() {
    this.service.clear();
    this.layer.removeChildren();
    this.transform = new Konva.Transformer(); 
    this.layer.add(this.transform);
    this.currentSelector = "screen";
  }

  public processOperation(type: string, shape: any) {
    if (type === "CREATE") {
      this.layer.add(this.getObject(shape['type'], shape)).batchDraw();
    } else if (type === "UPDATE") {
      let id = shape['id'];
      let op = this.stage.findOne("#" + id.toString());
      op.remove();
      op.destroy();
      let o = this.getObject(shape['type'], shape);
      this.layer.add(o).batchDraw();
    } else if (type === "DELETE") {
      let id = shape['id'];
      let op = this.stage.findOne("#" + id.toString());
      op.remove();
      op.destroy();
    } else if(type === "CLEAR") {
      this.clear();
    }
  }

  //get type
  public getType(event: any) {
    let shape = event.srcElement.innerText;
    let type: any;
    console.log(shape);
    switch (shape) {
      case "▭":
        type = "Rectangle";
        break;
      case "◯":
        type = "Circle";
        break;
      case "⬜":
        type = "Square";
        break;
      case "⬠":
        type = "RegularPolygon";
        break;
      case "⬭":
        type = "Ellipse";
        break;
      case "△":
        type = "Triangle";
        break;
    }
    return type;
  }

  public chooseFile(event : any) {
    this.pop = false;
    let val = event.target.value;
    if(val === "js") {
      this.form = "JSON";
    }
    else if(val === "xm") {
      this.form = "XML";
    }
    else{
      return;
    }
    this.service.save(this.stage.toJSON(),this.form,this.filename).subscribe(response=>{
      this.download(response);
    });
  }

  public save(event : any) {
    this.pop = true;
  }

  public download(response:any){
    let link = document.createElement('a');
    link.download = response.name;
    console.log(response.url);
    link.href = response.url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  public selectFile(event: any): void {
    this.selectedFiles = event.target.files;
    this.selected=true;
  }

  public load(event:any){
    this.layer.removeChildren();
    this.transform = new Konva.Transformer(); 
    this.layer.add(this.transform);
    this.currentSelector = "screen";
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);

      if (file) {
        this.currentFile = file;

        this.service.load(this.currentFile).subscribe(responseData=>{
          console.log(responseData);
          let x=responseData['children'];
          console.log(x);
          let y = x['0'];
          console.log(y);
          let z = y['children'];
          console.log(z);
          let arr = <Array<any>>z;
          console.log(arr);
          for(let i=0;i<arr.length;i++) {
            if(i === 0) continue;
            let shape = arr[i]['attrs'];
            this.delay(100);
            this.processOperation("CREATE",shape);
          }
      
        });
      }
      this.selectedFiles = undefined;
      this.selected=false;
    }
  }

  public getObject(type: string, shape: any) {
    let choosenShape: any;
    switch (type) {
      case "Rectangle":
        choosenShape = new Konva.Rect(shape);
        break;
      case "Circle":
        choosenShape = new Konva.Circle(shape);
        break;
      case "Ellipse":
        choosenShape = new Konva.Ellipse(shape);
        break;
      case "Square":
        choosenShape = new Konva.Rect(shape);
        break;
      case "LineSegment":
        choosenShape = new Konva.Line(shape);
        break;
      case "Triangle":
        choosenShape = new Konva.RegularPolygon(shape);
        break;
      case "RegularPolygon":
        choosenShape = new Konva.RegularPolygon(shape);
        break;
    }
    return choosenShape;
  }

  // return shape
  public getShape(shape: string) {
    let choosenShape: any;
    switch (shape) {
      case "Rectangle":
        choosenShape = new Konva.Rect();
        break;
      case "Circle":
        choosenShape = new Konva.Circle();
        break;
      case "Ellipse":
        choosenShape = new Konva.Ellipse();
        break;
      case "Square":
        choosenShape = new Konva.Rect();
        break;
      case "Triangle":
        choosenShape = new Konva.RegularPolygon();
        break;
      case "RegularPolygon":
        choosenShape = new Konva.RegularPolygon();
        break;
    }
    return choosenShape;
  }
  
}