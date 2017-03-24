console.log(1);

import { ViewerPedigree } from "./src/viewerPedigree";

window.jQuery = jquery;
window.jquery = jquery;


const prefix = "/js/ext-lib/panogram";
const probandDataUrl = "/public/xwiki/PhenoTips.PatientClass/0.xml";
const pedigreeDataUrl = "/public/xwiki/PhenoTips.PedigreeClass/0.xml";


var testData = JSON.stringify([{
	"disorders": [],
	"externalIDHref": "/patient/12764",
	"externalId": "NR_114000358_mother",
	"focused": 0,
	"gender": "F",
	"hpoTerms": [],
	"id": "5752",
	"proband": 0,
	"sex": "F"
}, {
	"disorders": [],
	"externalIDHref": "/patient/12765",
	"externalId": "NR_114000358_father",
	"focused": 0,
	"gender": "M",
	"hpoTerms": [],
	"id": "5753",
	"proband": 0,
	"sex": "M"
}, {
	"disorders": [
		"Complex Parkinsonism (includes pallido-pyramidal syndromes)"
	],
	"externalIDHref": "/patient/12766",
	"externalId": "LP3000037-DNA_A02",
	"father": 5753,
	"mother": 5752,
	"focused": 1,
	"gender": "M",
	"hpoTerms": [
		"some",
		"hpo",
		"terms wih a really really long namereally really long name really really long name",
    "really really long namereally really long namereally really long namereally really long name"
	],
	"id": "5754",
	"proband": 1,
	"sex": "M"
}]); 

const render = ({ data, probandDataUrl, pedigreeDataUrl }) => {
    jquery("doc").ready(() => {
        new ViewerPedigree({
            type: "simpleJSON",
            data: testData,
            probandDataUrl, // TODO replace loading of this with webpak module
            pedigreeDataUrl,
        });
    });
};

const getPedigreeData = patientId => jquery.ajax({
    url: `/patient/${patientId}/pedigree.json`,
    method: "GET",
});

const getDataAndRender = patientId => {
    getPedigreeData(patientId)
    .then(data => {
      console.log(data);
      render({
        data,
        probandDataUrl,
        pedigreeDataUrl,
      })
    })
    .catch(err => {
        if (err.status === 403) {
            jquery('body').append('<p>please <a href="http://localhost:8000">log in</a></p>');
        }
        console.trace(err);
    });
};

const createInput = () => {
    jquery(document).ready(() => {
        jquery('body').prepend('<span>Patient ID: </span><input type="number" name="patientId" id="patientId"></input><button id="go">go</button> <a href="" id="525">525</a>, <a href="" id="9971">9971</a>, <a href="" id="4247">4247</a>');
        jquery('#go').on('click', e => {
            e.preventDefault();
            const patientId = jquery('#patientId').val().strip();
            getDataAndRender(patientId);
        });
        jquery('#9971').on('click', e => {
            e.preventDefault();
            getDataAndRender(9971);
        });
        jquery('#525').on('click', e => {
            e.preventDefault();
            getDataAndRender(525);
        });
        jquery('#4247').on('click', e => {
            e.preventDefault();
            getDataAndRender(4247);
        });
    });
};

jquery('doc').ready(() => {
    const patientId = jQuery('#panogram').data('patient-id');
    const development = jQuery('#panogram').data('env') === 'dev';

    if (development) {
        createInput();
    }

    getDataAndRender(patientId);
});
