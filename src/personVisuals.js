import { AbstractPersonVisuals } from './abstractPersonVisuals';
import { InfoHoverbox } from './infoHoverbox';
import { ReadOnlyHoverbox } from './readonlyHoverbox';
import { PersonHoverbox } from './personHoverbox';
import { PedigreeEditorAttributes } from './pedigreeEditorAttributes';
import { sector, getElementHalfHeight } from './graphicHelpers';
import { getAge } from './ageCalc';
import { ChildlessBehaviorVisuals } from './abstractNodeVisuals';

/**
 * Class for organizing graphics for Person nodes.
 *
 * @class PersonVisuals
 * @extends AbstractPersonVisuals
 * @constructor
 * @param {Person} node The node for which the graphics are handled
 * @param {Number} x The x coordinate on the canvas
 * @param {Number} y The y coordinate on the canvas
 */

export const PersonVisuals = Class.create(AbstractPersonVisuals, {
    
  initialize: function($super, node, x, y) {
        //var timer = new Timer();
        //console.log("person visuals");
    console.log(node);
    $super(node, x, y);    	
    this._nameLabel = null;
    this._stillBirthLabel = null;
    this._ageLabel = null;
    this._externalIDLabel = null;
    this._commentsLabel = null;
    this._childlessStatusLabel = null;
    this._disorderShapes = null;
    this._deadShape = null;
    this._unbornShape = null;
    this._childlessShape = null;
    this._isSelected = false;
    this._carrierGraphic = null;
    this._evalLabel = null;
        //console.log("person visuals end");
        //timer.printSinceLast("Person visuals time");
  },

  generateHoverbox: function(x, y) {
    if (editor.isReadOnlyMode()) {
      if (this.getNode().isInferred()) {
        return new ReadOnlyHoverbox(this.getNode(), x, y, this.getGenderGraphics());
      } else {
        return new InfoHoverbox(this.getNode(), x, y, this.getGenderGraphics());
      }
    } else {
      return new PersonHoverbox(this.getNode(), x, y, this.getGenderGraphics());
    }
  },
 
    /**
     * Draws the icon for this Person depending on the gender, life status and whether this Person is the proband.
     * Updates the disorder shapes.
     *
     * @method setGenderGraphics
     */
  setGenderGraphics: function($super) {
    console.log('set gender graphics');
    if(this.getNode().getLifeStatus() == 'aborted' || this.getNode().getLifeStatus() == 'miscarriage') {
      this._genderGraphics && this._genderGraphics.remove();

      var radius = PedigreeEditorAttributes.radius;
      if (this.getNode().isPersonGroup())
        radius *= PedigreeEditorAttributes.groupNodesScale;
      this._shapeRadius = radius;

      var side = radius * Math.sqrt(3.5),
        height = side/Math.sqrt(2),
        x = this.getX() - height,
        y = this.getY();
      var shape = editor.getPaper().path(['M',x, y, 'l', height, -height, 'l', height, height,'z']);
      shape.attr(PedigreeEditorAttributes.nodeShape);
      this._genderShape = shape;
      shape = editor.getPaper().set(shape.glow({width: 5, fill: true, opacity: 0.1}).transform(['t',3,3,'...']), shape);

      if(this.getNode().isProband()) {
        shape.transform(['...s', 1.07]);
                // shape.attr("stroke-width", 5);
      }

      if(this.getNode().getGender() == 'U') {
        this._genderGraphics = shape;
      }
      else {
        x = this.getX();
        y = this.getY() + radius/1.4;
        var text = (this.getNode().getGender() == 'M') ? 'Male' : 'Female';
        var genderLabel = editor.getPaper().text(x, y, text).attr(PedigreeEditorAttributes.label);
        this._genderGraphics = editor.getPaper().set(shape, genderLabel);
      }
    }
    else {
      $super();
    }

    if(this.getNode().isProband()) {
      this._genderGraphics.push(this.generateProbandArrow());
      this.getGenderShape().transform(['...s', 1.08]);
            // this.getGenderShape().attr("stroke-width", 5.5);
    }
    // if(!this.getNode().getDataPresence()) {
    //   const path = this.getGenderShape().clone();
    //   path.attr('stroke-dasharray', '- ');
    //   path.attr('stroke-width', 1.5);
    //   path.attr('stroke', 'white');
    //   path.attr('fill-opacity', 0);
    // }
    if(this.getNode().isFocused()) {
      this.getGenderShape().attr('stroke-width', 3.5);
      this.getGenderShape().attr('stroke', 'blue');
    }
    if(!editor.isUnsupportedBrowser() && this.getHoverBox()) {
      this._genderGraphics.flatten().insertBefore(this.getFrontElements().flatten());
    }
    this.updateDisorderShapes();
    this.updateCarrierGraphic();
    this.updateEvaluationLabel();
  },

  generateProbandArrow: function() {
    var icon = editor.getPaper().path(editor.getView().__probandArrowPath).attr({fill: '#595959', stroke: 'none', opacity: 1});
    var x = this.getX()-this._shapeRadius-26;
    var y = this.getY()+this._shapeRadius-12;
    if (this.getNode().getGender() == 'F') {
      x += 5;
      y -= 5;
    }
    icon.transform(['t' , x, y]);
    editor.getKey().showElement('proband');
    return icon;
  },

    /**
     * Returns all graphical elements that are behind the gender graphics
     *
     * @method getBackElements
     * @return {Raphael.st}
     */
  getBackElements: function() {
    return this.getHoverBox().getBackElements().concat(editor.getPaper().set(this.getChildlessStatusLabel(), this.getChildlessShape()));
  },

    /**
     * Returns all graphical elements that should receive mouse focus/clicks
     *
     * @method getFrontElements
     * @return {Raphael.st}
     */
  getFrontElements: function() {
    return this.getHoverBox().getFrontElements();
  },

    /**
     * Updates the external ID label for this Person
     *
     * @method updateExternalIDLabel
     */    
  updateExternalIDLabel: function() {
    this._externalIDLabel && this._externalIDLabel.remove();
                
    if (this.getNode().getExternalID()) {
      var text = '[ ' + this.getNode().getExternalID() + ' ]';
      var href = this.getNode().getExternalIDHref();
      let attrs = PedigreeEditorAttributes.externalIDLabels;
      if (href) {
        attrs.href = href;
      }
      this._externalIDLabel = editor.getPaper()
            .text(this.getX(), this.getY() + PedigreeEditorAttributes.radius, text)
            .attr(attrs);
    } else {
      this._externalIDLabel = null;
    }
    this.drawLabels();        
  },
    
    /**
     * Returns the Person's external ID label
     *
     * @method getExternalIDLabel
     * @return {Raphael.el}
     */
  getExternalIDLabel: function() {
    return this._externalIDLabel;
  },    
    
    /**
     * Updates the name label for this Person
     *
     * @method updateNameLabel
     */
  updateNameLabel: function() {
    this._nameLabel && this._nameLabel.remove();
    var text =  '';
    this.getNode().getFirstName() && (text = this.getNode().getFirstName());
                
    if (this.getNode().getLastName()) {
      text += ' ' + this.getNode().getLastName();
      this.getNode().getLastNameAtBirth() && (text += ' (' + this.getNode().getLastNameAtBirth() + ')');
    }
    else
            this.getNode().getLastNameAtBirth() && (text += ' ' + this.getNode().getLastNameAtBirth());
        
    this._nameLabel && this._nameLabel.remove();
    if(text.strip() != '') {
      this._nameLabel = editor.getPaper().text(this.getX(), this.getY() + PedigreeEditorAttributes.radius, text).attr(PedigreeEditorAttributes.nameLabels);
    }
    else {
      this._nameLabel = null;
    }
    this.drawLabels();
  },

    /**
     * Returns the Person's name label
     *
     * @method getNameLabel
     * @return {Raphael.el}
     */
  getNameLabel: function() {
    return this._nameLabel;
  },

    /**
     * Returns colored blocks representing disorders
     *
     * @method getDisorderShapes
     * @return {Raphael.st} Set of disorder shapes
     */
  getDisorderShapes: function() {
    return this._disorderShapes;
  },

    /**
     * Displays the disorders currently registered for this node.
     *
     * @method updateDisorderShapes
     */
  updateDisorderShapes: function() {
    this._disorderShapes && this._disorderShapes.remove();
    var colors = this.getNode().getAllNodeColors();
    if (colors.length == 0) return;

    var gradient = function(color, angle) {
      var hsb = Raphael.rgb2hsb(color),
        darker = Raphael.hsb2rgb(hsb['h'],hsb['s'],hsb['b']-.1)['hex'];
      return angle +'-'+darker+':0-'+color+':100';
    };
    var disorderShapes = editor.getPaper().set();
    var delta, color, radius;

    if (this.getNode().getLifeStatus() == 'aborted' || this.getNode().getLifeStatus() == 'miscarriage') {
      radius = PedigreeEditorAttributes.radius;
      if (this.getNode().isPersonGroup())
        radius *= PedigreeEditorAttributes.groupNodesScale;

      var side = radius * Math.sqrt(3.5),
        height = side/Math.sqrt(2),
        x1 = this.getX() - height,
        y1 = this.getY();
      delta = (height * 2)/(colors.length);

      for(var k = 0; k < colors.length; k++) {
        var corner = [];
        var x2 = x1 + delta;
        var y2 = this.getY() - (height - Math.abs(x2 - this.getX()));
        if (x1 < this.getX() && x2 >= this.getX()) {
          corner = ['L', this.getX(), this.getY()-height];
        }
        var slice = editor.getPaper().path(['M', x1, y1, corner,'L', x2, y2, 'L',this.getX(), this.getY(),'z']);
        color = gradient(colors[k], 70);
        disorderShapes.push(slice.attr({fill: color, 'stroke-width':.5, stroke: 'none' }));
        x1 = x2;
        y1 = y2;
      }
      if(this.getNode().isProband()) {
        disorderShapes.transform(['...s', 1.04, 1.04, this.getX(), this.getY()-this._shapeRadius]);
      }
    }
    else {
      var disorderAngle = (360/colors.length).round();
      delta = (360/(colors.length))/2;
      if (colors.length == 1 && this.getNode().getGender() == 'U')
        delta -= 45; // since this will be rotated by shape transform later

      radius = (this._shapeRadius-0.6);    // -0.6 to avoid disorder fills to overlap with shape borders (due to aliasing/Raphael pixel layout)
      if (this.getNode().getGender() == 'U')
        radius *= 1.155;                     // TODO: magic number hack: due to a Raphael transform bug (?) just using correct this._shapeRadius does not work

      for(var i = 0; i < colors.length; i++) {
                //color = gradient(colors[i], (i * disorderAngle)+delta);
        disorderShapes.push(sector(editor.getPaper(), this.getX(), this.getY(), radius,
                                    this.getNode().getGender(), i * disorderAngle, (i+1) * disorderAngle, colors[i]));
      }

      (disorderShapes.length < 2) ? disorderShapes.attr('stroke', 'none') : disorderShapes.attr({stroke: '#595959', 'stroke-width':.03});
      if(this.getNode().isProband()) {
        disorderShapes.transform(['...s', 1.04, 1.04, this.getX(), this.getY()]);
      }
    }
    this._disorderShapes = disorderShapes;
    this._disorderShapes.flatten().insertAfter(this.getGenderGraphics().flatten());
  },

    /**
     * Draws a line across the Person to display that he is dead (or aborted).
     *
     * @method drawDeadShape
     */
  drawDeadShape: function() {
    var strokeWidth = editor.getWorkspace().getSizeNormalizedToDefaultZoom(2.5);
    var x, y;
    if(this.getNode().getLifeStatus() == 'aborted') {
      var side   = PedigreeEditorAttributes.radius * Math.sqrt(3.5);
      var height = side/Math.sqrt(2);
      if (this.getNode().isPersonGroup())
        height *= PedigreeEditorAttributes.groupNodesScale;

      x = this.getX() - height/1.5;
      if (this.getNode().isPersonGroup())
        x -= PedigreeEditorAttributes.radius/4;

      y = this.getY() + height/3;
      this._deadShape = editor.getPaper().path(['M', x, y, 'l', height + height/3, -(height+ height/3), 'z']);
      this._deadShape.attr('stroke-width', strokeWidth);
    }
    else {
      x = this.getX();
      y = this.getY();
      var coeff = 10.0/8.0 * (this.getNode().isPersonGroup() ? PedigreeEditorAttributes.groupNodesScale : 1.0);
      var x1 = x - coeff * PedigreeEditorAttributes.radius,
        y1 = y + coeff * PedigreeEditorAttributes.radius,
        x2 = x + coeff * PedigreeEditorAttributes.radius,
        y2 = y - coeff * PedigreeEditorAttributes.radius;
      this._deadShape = editor.getPaper().path(['M', x1,y1,'L',x2, y2]).attr('stroke-width', strokeWidth);
    }
    if(!editor.isUnsupportedBrowser()) {
      this._deadShape.toFront();
      this._deadShape.node.setAttribute('class', 'no-mouse-interaction');
    }
  },

    /**
     * Returns the line drawn across a dead Person's icon
     *
     * @method getDeadShape
     * @return {Raphael.st}
     */
  getDeadShape: function() {
    return this._deadShape;
  },

    /**
     * Returns this Person's age label
     *
     * @method getAgeLabel
     * @return {Raphael.el}
     */
  getAgeLabel: function() {
    return this._ageLabel;
  },

    /**
     * Updates the age label for this Person
     *
     * @method updateAgeLabel
     */
  updateAgeLabel: function() {
    var text, age,
      person = this.getNode();
    if (person.isFetus()) {
      var date = person.getGestationAge();
      text = (date) ? date + ' weeks' : null;
    }
    else if(person.getLifeStatus() == 'alive') {
      if (person.getBirthDate()) {
        age = getAge(person.getBirthDate(), null);
        if (age.indexOf('day') != -1) {
          text = age;                                                                // 5 days
        } else if (age.indexOf(' y') == -1) {
          text = 'b. ' + person.getBirthDate().getFullYear() + ' (' + age + ')';     // b. 2014 (3 wk)
        } else {
          text = 'b. ' + person.getBirthDate().getFullYear();                        // b. 1972
        }
      }
    }
    else {
      if(person.getDeathDate() && person.getBirthDate()) {
        age = getAge(person.getBirthDate(), person.getDeathDate());
        if (age.indexOf('day') != -1 || age.indexOf('wk') != -1 || age.indexOf('mo') != -1) {
          text = 'd. ' + person.getDeathDate().getFullYear() + ' (' + age + ')';
        } else {
          text = person.getBirthDate().getFullYear() + ' – ' + person.getDeathDate().getFullYear();
        }
      }
      else if (person.getDeathDate()) {
        text = 'd. ' + person.getDeathDate().getFullYear();
      }
      else if(person.getBirthDate()) {
        text = person.getBirthDate().getFullYear() + ' – ?';
      }
    }
    this.getAgeLabel() && this.getAgeLabel().remove();
    this._ageLabel = text ? editor.getPaper().text(this.getX(), this.getY(), text).attr(PedigreeEditorAttributes.label) : null;
    this.drawLabels();
  },

    /**
     * Returns the shape marking a Person's 'unborn' life-status
     *
     * @method getUnbornShape
     * @return {Raphael.el}
     */
  getUnbornShape: function() {
    return this._unbornShape;
  },

    /**
     * Draws a "P" on top of the node to display this Person's 'unborn' life-status
     *
     * @method drawUnbornShape
     */
  drawUnbornShape: function() {
    this._unbornShape && this._unbornShape.remove();
    if(this.getNode().getLifeStatus() == 'unborn') {
      this._unbornShape = editor.getPaper().text(this.getX(), this.getY(), 'P').attr(PedigreeEditorAttributes.unbornShape);
      if(!editor.isUnsupportedBrowser())
        this._unbornShape.insertBefore(this.getHoverBox().getFrontElements());
    } else {
      this._unbornShape = null;
    }
  },

    /**
     * Draws the evaluation status symbol for this Person
     *
     * @method updateEvaluationLabel
     */
  updateEvaluationLabel: function() {
    var x, y;
    this._evalLabel && this._evalLabel.remove();
    if (this.getNode().getEvaluated()) {
      if (this.getNode().getLifeStatus() == 'aborted' || this.getNode().getLifeStatus() == 'miscarriage') {
        x = this.getX() + this._shapeRadius * 1.6;
        y = this.getY() + this._shapeRadius * 0.6;
      }
      else {
        var mult = 1.1;
        if (this.getNode().getGender() == 'U') mult = 1.3;
        else if (this.getNode().getGender() == 'M') mult = 1.4;
        if (this.getNode().isProband) mult *= 1.1;
        x = this.getX() + this._shapeRadius*mult - 5;
        y = this.getY() + this._shapeRadius*mult;
      }
      this._evalLabel = editor.getPaper().text(x, y, '*').attr(PedigreeEditorAttributes.evaluationShape).toBack();
    } else {
      this._evalLabel = null;
    }
  },

    /**
     * Returns this Person's evaluation label
     *
     * @method getEvaluationGraphics
     * @return {Raphael.el}
     */    
  getEvaluationGraphics: function() {
    return this._evalLabel;
  },

    /**
     * Draws various distorder carrier graphics such as a dot (for carriers) or
     * a vertical line (for pre-symptomatic)
     *
     * @method updateCarrierGraphic
     */
  updateCarrierGraphic: function() {
    var x, y;
    this._carrierGraphic && this._carrierGraphic.remove();
    var status = this.getNode().getCarrierStatus();

    if (status != '' && status != 'affected') {
      if (status == 'carrier') {
        if (this.getNode().getLifeStatus() == 'aborted' || this.getNode().getLifeStatus() == 'miscarriage') {
          x = this.getX();
          y = this.getY() - this._radius/2;
        } else {
          x = this.getX();
          y = this.getY();
        }
        this._carrierGraphic = editor.getPaper().circle(x, y, PedigreeEditorAttributes.carrierDotRadius).attr(PedigreeEditorAttributes.carrierShape);
      } else if (status == 'presymptomatic') {
        if (this.getNode().getLifeStatus() == 'aborted' || this.getNode().getLifeStatus() == 'miscarriage') {
          this._carrierGraphic = null;
          return;
        }
        editor.getPaper().setStart();
        var startX = (this.getX()-PedigreeEditorAttributes.presymptomaticShapeWidth/2);
        var startY = this.getY()-this._radius;
        editor.getPaper().rect(startX, startY, PedigreeEditorAttributes.presymptomaticShapeWidth, this._radius*2).attr(PedigreeEditorAttributes.presymptomaticShape);
        if (this.getNode().getGender() == 'U') {
          editor.getPaper().path('M '+startX + ' ' + startY +
                                           'L ' + (this.getX()) + ' ' + (this.getY()-this._radius*1.1) +
                                           'L ' + (startX + PedigreeEditorAttributes.presymptomaticShapeWidth) + ' ' + (startY) + 'Z').attr(PedigreeEditorAttributes.presymptomaticShape);
          var endY = this.getY()+this._radius;
          editor.getPaper().path('M '+startX + ' ' + endY +
                                           'L ' + (this.getX()) + ' ' + (this.getY()+this._radius*1.1) +
                                           'L ' + (startX + PedigreeEditorAttributes.presymptomaticShapeWidth) + ' ' + endY + 'Z').attr(PedigreeEditorAttributes.presymptomaticShape);
        }   
        this._carrierGraphic = editor.getPaper().setFinish();
      }
      if (editor.isReadOnlyMode())
        this._carrierGraphic.toFront();
      else
                this._carrierGraphic.insertBefore(this.getHoverBox().getFrontElements());
    } else {
      this._carrierGraphic = null;
    }
  },

    /**
     * Returns this Person's disorder carrier graphics
     *
     * @method getCarrierGraphics
     * @return {Raphael.el}
     */    
  getCarrierGraphics: function() {
    return this._carrierGraphic;
  },
    
    /**
     * Returns this Person's stillbirth label
     *
     * @method getSBLabel
     * @return {Raphael.el}
     */
  getSBLabel: function() {
    return this._stillBirthLabel;
  },

    /**
     * Updates the stillbirth label for this Person
     *
     * @method updateSBLabel
     */
  updateSBLabel: function() {
    this.getSBLabel() && this.getSBLabel().remove();        
    if (this.getNode().getLifeStatus() == 'stillborn') {        
      this._stillBirthLabel = editor.getPaper().text(this.getX(), this.getY(), 'SB').attr(PedigreeEditorAttributes.label);
    } else {
      this._stillBirthLabel = null;
    }
    this.drawLabels();
  },
       
    /**
     * Returns this Person's comments label
     *
     * @method getCommentsLabel
     * @return {Raphael.el}
     */
  getCommentsLabel: function() {
    return this._commentsLabel;
  },

    /**
     * Updates the stillbirth label for this Person
     *
     * @method updateCommentsLabel
     */
  updateCommentsLabel: function() {
    this.getCommentsLabel() && this.getCommentsLabel().remove();
    if (this.getNode().getComments() != '') {
      var text = this.getNode().getComments(); //.replace(/\n/g, '<br />');
      this._commentsLabel = editor.getPaper().text(this.getX(), this.getY(), text).attr(PedigreeEditorAttributes.commentLabel);
      this._commentsLabel.alignTop = true;
    } else {
      this._commentsLabel = null;
    }
    this.drawLabels();
    /**        
     *     
     */     
        
  },
   
   /**
    * Returns this Person's comments label
    *
    * @method getCommentsLabel
    * @return {Raphael.el}
    */
  getVariantsLabel: function() {
    return this._variantsLabel;
  },

   /**
    * Updates the stillbirth label for this Person
    *
    * @method updateCommentsLabel
    */
  updateVariantsLabel: function() {
    this.getVariantsLabel() && this.getVariantsLabel().remove();
    let variants = this.getNode().getVariants();
    if (variants.length) {
      variants.forEach(variant => {
        // let text = variant.hgvs_c;
        // if (variant.genotype.toLowerCase() === 'homozygous') {
        //   text += '•';
        // }
        // else if (variant.genotype.toLowerCase() === 'heterozygous'){
        //   text += '••';
        // }
        this._variantsLabel = editor.getPaper().text(this.getX(), this.getY(), variant.genotype).attr(PedigreeEditorAttributes.commentLabel);
        this._variantsLabel.alignTop = true;
      });
    } else {
      this._variantsLabel = null;
    }
    //editor.getKey().showElement('variants');
    editor.getKey().showElement('readsplits');
    this.drawLabels();
  },
 
    /**
     * Displays the correct graphics to represent the current life status for this Person.
     *
     * @method updateLifeStatusShapes
     */
  updateLifeStatusShapes: function(oldStatus) {
    var status = this.getNode().getLifeStatus();

    this.getDeadShape()   && this.getDeadShape().remove();
    this.getUnbornShape() && this.getUnbornShape().remove();
    this.getSBLabel()     && this.getSBLabel().remove();

        // save some redraws if possible
    var oldShapeType = (oldStatus == 'aborted' || oldStatus == 'miscarriage');
    var newShapeType = (status    == 'aborted' || status    == 'miscarriage');
    if (oldShapeType != newShapeType)
      this.setGenderGraphics();

    if(status == 'deceased' || status == 'aborted') {  // but not "miscarriage"
      this.drawDeadShape();
    }
    else if (status == 'stillborn') {
      this.drawDeadShape();
      this.updateSBLabel();
    }
    else if (status == 'unborn') {
      this.drawUnbornShape();
    }
    this.updateAgeLabel();
  },

    /**
     * Marks this node as hovered, and moves the labels out of the way
     *
     * @method setSelected
     */
  setSelected: function($super, isSelected) {
    $super(isSelected);
    if(isSelected) {
      this.shiftLabels();
    }
    else {
      this.unshiftLabels();
    }
  },

    /**
     * Moves the labels down to make space for the hoverbox
     *
     * @method shiftLabels
     */
  shiftLabels: function() {
    var shift  = this._labelSelectionOffset(); 
    var labels = this.getLabels();
    for(var i = 0; i<labels.length; i++) {
      labels[i].stop().animate({'y': labels[i].oy + shift}, 200,'>');
    }
  },

    /**
     * Animates the labels of this node to their original position under the node
     *
     * @method unshiftLabels
     */
  unshiftLabels: function() {
    var labels = this.getLabels();
    var firstLable = this._childlessStatusLabel ? 1 : 0;
    for(var i = 0; i<labels.length; i++) {
      labels[i].stop().animate({'y': labels[i].oy}, 200,'>');
    }
  },

    /**
     * Returns set of labels for this Person
     *
     * @method getLabels
     * @return {Raphael.st}
     */
  getLabels: function() {
    var labels = editor.getPaper().set();        
    this.getSBLabel() && labels.push(this.getSBLabel());
    this.getNameLabel() && labels.push(this.getNameLabel());
    this.getAgeLabel() && labels.push(this.getAgeLabel());        
    this.getExternalIDLabel() && labels.push(this.getExternalIDLabel());
    this.getCommentsLabel() && labels.push(this.getCommentsLabel());
    this.getVariantsLabel() && labels.push(this.getVariantsLabel());
    return labels;
  },

    /**
     * Displays all the appropriate labels for this Person in the correct layering order
     *
     * @method drawLabels
     */
  drawLabels: function() {
    var labels = this.getLabels();
    var selectionOffset = this._labelSelectionOffset();
    var childlessOffset = this.getChildlessStatusLabel() ? PedigreeEditorAttributes.label['font-size'] : 0;
    childlessOffset += ((this.getNode().getChildlessStatus() !== null) ? (PedigreeEditorAttributes.infertileMarkerHeight + 2) : 0);
                    
    var lowerBound = PedigreeEditorAttributes.radius * (this.getNode().isPersonGroup() ? PedigreeEditorAttributes.groupNodesScale : 1.0);
                
    var startY = this.getY() + lowerBound * 1.8 + selectionOffset + childlessOffset;
    for (var i = 0; i < labels.length; i++) {
      var offset = (labels[i].alignTop) ? (getElementHalfHeight(labels[i]) - 7) : 0;
      labels[i].attr('y', startY + offset);
      labels[i].oy = (labels[i].attr('y') - selectionOffset);
      startY = labels[i].getBBox().y2 + 11;
    }
    if(!editor.isUnsupportedBrowser())
      labels.flatten().insertBefore(this.getHoverBox().getFrontElements().flatten());
  },
    
  _labelSelectionOffset: function() {
    var selectionOffset = this.isSelected() ? PedigreeEditorAttributes.radius/1.4 : 0;

    if (this.isSelected() && this.getNode().isPersonGroup())
      selectionOffset += PedigreeEditorAttributes.radius * (1-PedigreeEditorAttributes.groupNodesScale) + 5;
        
    if (this.getChildlessStatusLabel())
      selectionOffset = selectionOffset/2;
    return selectionOffset;        
  },

    /**
     * Returns set with the gender icon, disorder shapes and life status shapes.
     *
     * @method getShapes
     * @return {Raphael.st}
     */
  getShapes: function($super) {
    var lifeStatusShapes = editor.getPaper().set();
    this.getUnbornShape() && lifeStatusShapes.push(this.getUnbornShape());
    this.getChildlessShape() && lifeStatusShapes.push(this.getChildlessShape());
    this.getChildlessStatusLabel() && lifeStatusShapes.push(this.getChildlessStatusLabel());
    this.getDeadShape() && lifeStatusShapes.push(this.getDeadShape());
    return $super().concat(editor.getPaper().set(this.getDisorderShapes(), lifeStatusShapes));
  },

    /**
     * Returns all the graphics and labels associated with this Person.
     *
     * @method getAllGraphics
     * @return {Raphael.st}
     */
  getAllGraphics: function($super) {
        //console.log("Node " + this.getNode().getID() + " getAllGraphics");
    return $super().push(this.getHoverBox().getBackElements(), this.getLabels(), this.getCarrierGraphics(), this.getEvaluationGraphics(), this.getHoverBox().getFrontElements());
  },

    /**
     * Changes the position of the node to (x,y)
     *
     * @method setPos
     * @param [$super]
     * @param {Number} x the x coordinate on the canvas
     * @param {Number} y the y coordinate on the canvas
     * @param {Boolean} animate set to true if you want to animate the transition
     * @param {Function} callback a function that will be called at the end of the animation
     */
  setPos: function($super, x, y, animate, callback) {
    var funct = callback;        
    if(animate) {
      var me = this;
      this.getHoverBox().disable();
      funct = function () {
        me.getHoverBox().enable();
        callback && callback();
      };
    }
    $super(x, y, animate, funct);
  }
});

//ATTACHES CHILDLESS BEHAVIOR METHODS
PersonVisuals.addMethods(ChildlessBehaviorVisuals);
