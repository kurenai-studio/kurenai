"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeCommand = void 0;
class CompositeCommand {
    meta;
    children;
    constructor(meta, children) {
        this.meta = meta;
        this.children = children;
    }
    async undo() {
        const undone = [];
        for (let index = this.children.length - 1; index >= 0; index--) {
            const child = this.children[index];
            const result = await child.undo();
            if (!result.success) {
                // 如果某一步 undo 失败，把前面已经 undo 的子命令重新 redo 回去，
                // 尽量恢复到执行 undo 之前的状态，避免只恢复了一半。
                for (let i = undone.length - 1; i >= 0; i--) {
                    try {
                        await undone[i].redo();
                    }
                    catch (_e) {
                        // 某个补偿操作失败时，继续处理剩下的子命令。
                    }
                }
                return result;
            }
            undone.push(child);
        }
        return { success: true, commandId: this.meta.id, label: this.meta.label };
    }
    async redo() {
        const redone = [];
        for (const child of this.children) {
            const result = await child.redo();
            if (!result.success) {
                // 如果某一步 redo 失败，把前面已经 redo 的子命令重新 undo 回去，
                // 尽量恢复到执行 redo 之前的状态，避免只恢复了一半。
                for (let i = redone.length - 1; i >= 0; i--) {
                    try {
                        await redone[i].undo();
                    }
                    catch (_e) {
                        // 某个补偿操作失败时，继续处理剩下的子命令。
                    }
                }
                return result;
            }
            redone.push(child);
        }
        return { success: true, commandId: this.meta.id, label: this.meta.label };
    }
}
exports.CompositeCommand = CompositeCommand;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9zaXRlLWNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9zY2VuZS9zY2VuZS1wcm9jZXNzL3NlcnZpY2UvdW5kby9jb21tYW5kcy9jb21wb3NpdGUtY29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxNQUFhLGdCQUFnQjtJQUVkO0lBQ1U7SUFGckIsWUFDVyxJQUFzQixFQUNaLFFBQXdCO1FBRGxDLFNBQUksR0FBSixJQUFJLENBQWtCO1FBQ1osYUFBUSxHQUFSLFFBQVEsQ0FBZ0I7SUFDekMsQ0FBQztJQUVMLEtBQUssQ0FBQyxJQUFJO1FBQ04sTUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxLQUFLLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDN0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQiwyQ0FBMkM7Z0JBQzNDLCtCQUErQjtnQkFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQzt3QkFDRCxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQztvQkFBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO3dCQUNWLHdCQUF3QjtvQkFDNUIsQ0FBQztnQkFDTCxDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFDRCxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUUsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ04sTUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQiwyQ0FBMkM7Z0JBQzNDLCtCQUErQjtnQkFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQzt3QkFDRCxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQztvQkFBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO3dCQUNWLHdCQUF3QjtvQkFDNUIsQ0FBQztnQkFDTCxDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7UUFDRCxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDOUUsQ0FBQztDQUNKO0FBaERELDRDQWdEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgSVVuZG9Db21tYW5kLCBJVW5kb0NvbW1hbmRNZXRhLCBJVW5kb1JlZG9SZXN1bHQgfSBmcm9tICcuLi8uLi8uLi8uLi9jb21tb24nO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9zaXRlQ29tbWFuZCBpbXBsZW1lbnRzIElVbmRvQ29tbWFuZCB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyBtZXRhOiBJVW5kb0NvbW1hbmRNZXRhLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGNoaWxkcmVuOiBJVW5kb0NvbW1hbmRbXSxcbiAgICApIHsgfVxuXG4gICAgYXN5bmMgdW5kbygpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCB1bmRvbmU6IElVbmRvQ29tbWFuZFtdID0gW107XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleC0tKSB7XG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hpbGQudW5kbygpO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOafkOS4gOatpSB1bmRvIOWksei0pe+8jOaKiuWJjemdouW3sue7jyB1bmRvIOeahOWtkOWRveS7pOmHjeaWsCByZWRvIOWbnuWOu++8jFxuICAgICAgICAgICAgICAgIC8vIOWwvemHj+aBouWkjeWIsOaJp+ihjCB1bmRvIOS5i+WJjeeahOeKtuaAge+8jOmBv+WFjeWPquaBouWkjeS6huS4gOWNiuOAglxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSB1bmRvbmUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHVuZG9uZVtpXS5yZWRvKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmn5DkuKrooaXlgb/mk43kvZzlpLHotKXml7bvvIznu6fnu63lpITnkIbliankuIvnmoTlrZDlkb3ku6TjgIJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdW5kb25lLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGNvbW1hbmRJZDogdGhpcy5tZXRhLmlkLCBsYWJlbDogdGhpcy5tZXRhLmxhYmVsIH07XG4gICAgfVxuXG4gICAgYXN5bmMgcmVkbygpOiBQcm9taXNlPElVbmRvUmVkb1Jlc3VsdD4ge1xuICAgICAgICBjb25zdCByZWRvbmU6IElVbmRvQ29tbWFuZFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hpbGQucmVkbygpO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOafkOS4gOatpSByZWRvIOWksei0pe+8jOaKiuWJjemdouW3sue7jyByZWRvIOeahOWtkOWRveS7pOmHjeaWsCB1bmRvIOWbnuWOu++8jFxuICAgICAgICAgICAgICAgIC8vIOWwvemHj+aBouWkjeWIsOaJp+ihjCByZWRvIOS5i+WJjeeahOeKtuaAge+8jOmBv+WFjeWPquaBouWkjeS6huS4gOWNiuOAglxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSByZWRvbmUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlZG9uZVtpXS51bmRvKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmn5DkuKrooaXlgb/mk43kvZzlpLHotKXml7bvvIznu6fnu63lpITnkIbliankuIvnmoTlrZDlkb3ku6TjgIJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVkb25lLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGNvbW1hbmRJZDogdGhpcy5tZXRhLmlkLCBsYWJlbDogdGhpcy5tZXRhLmxhYmVsIH07XG4gICAgfVxufVxuIl19