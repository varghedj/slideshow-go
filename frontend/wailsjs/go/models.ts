export namespace main {
	
	export class DirectoryResult {
	    dirPath: string;
	    images: string[];
	
	    static createFrom(source: any = {}) {
	        return new DirectoryResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dirPath = source["dirPath"];
	        this.images = source["images"];
	    }
	}

}

