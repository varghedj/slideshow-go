export namespace main {
	
	export class DirectoryImages {
	    dirPath: string;
	    images: string[];
	
	    static createFrom(source: any = {}) {
	        return new DirectoryImages(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dirPath = source["dirPath"];
	        this.images = source["images"];
	    }
	}

}

