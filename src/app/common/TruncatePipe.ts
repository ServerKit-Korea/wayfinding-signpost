import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "limitTo"
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, args: string, args2?: string): string {
    let limit = args ? parseInt(args, 10) : 10;
    let trail = args2 === undefined ? "..." : args2;

    if (value == undefined) {
      return "";
    }
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
