import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@/components/ui"

interface AddEditAuthorsDialogProps {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editing: any | null
  form: any
  onSubmit: (values: any) => Promise<void>
}

const AddEditAuthorsDialog = ({
  dialogOpen,
  setDialogOpen,
  editing,
  form,
  onSubmit,
}: AddEditAuthorsDialogProps) => {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>
            {editing ? "تعديل المؤلف" : "إضافة مؤلف جديد"}
          </DialogTitle>
        </DialogHeader>
        <form
          id="author-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">اسم المؤلف *</Label>
            <Input
              id="name"
              placeholder="أحمد مرسي"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">السيرة الذاتية</Label>
            <Textarea
              id="bio"
              placeholder="معلومات عن المؤلف..."
              rows={4}
              {...form.register("bio")}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>
            إلغاء
          </Button>
          <Button
            type="submit"
            form="author-form"
            loading={form.formState.isSubmitting}
          >
            {editing ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddEditAuthorsDialog
